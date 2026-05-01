/**
 * Netlify Function: stripe-webhook
 * Handles Stripe webhook events to fulfill orders after payment.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET   (from Stripe dashboard → Webhooks → signing secret)
 *
 * Events handled:
 *   checkout.session.completed  → digital product delivery or platform activation
 *   customer.subscription.deleted → deactivate platform access
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Map Stripe Price IDs to downloadable product keys
const DOWNLOAD_MAP = {
  [process.env.STRIPE_PRICE_TEMPLATE_PACK]:     'template-pack',
  [process.env.STRIPE_PRICE_SOW_TEMPLATE]:      'sow-template',
  [process.env.STRIPE_PRICE_PRICING_CALC]:      'pricing-calc',
  [process.env.STRIPE_PRICE_TX_GUIDE]:          'tx-guide',
  [process.env.STRIPE_PRICE_CLIENT_AGREEMENT]:  'client-agreement',
  [process.env.STRIPE_PRICE_FLIGHT_CHECKLIST]:  'flight-checklist',
};

const PLATFORM_PRICES = new Set([
  process.env.STRIPE_PRICE_PLATFORM_STARTER,
  process.env.STRIPE_PRICE_PLATFORM_GROWTH,
].filter(Boolean));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const customerEmail = session.customer_details?.email;
    const customerName  = session.customer_details?.name;

    // Get line items to determine what was purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
    const priceId = lineItems.data[0]?.price?.id;

    if (priceId && DOWNLOAD_MAP[priceId]) {
      // Digital product — generate download token and email it
      const productKey = DOWNLOAD_MAP[priceId];
      const token = Buffer.from(`${productKey}:${session.id}:${Date.now()}`).toString('base64url');
      const downloadUrl = `${process.env.URL}/.netlify/functions/get-download?token=${token}`;

      console.log(`Digital product purchased: ${productKey} by ${customerEmail}`);
      console.log(`Download URL: ${downloadUrl}`);

      // Send download email via your automation server or Zoho
      await sendDownloadEmail({ customerEmail, customerName, productKey, downloadUrl });
    } else if (priceId && PLATFORM_PRICES.has(priceId)) {
      // Platform subscription activated
      console.log(`Platform subscription activated for ${customerEmail}`);
      await sendPlatformWelcomeEmail({ customerEmail, customerName, sessionId: session.id });
    } else {
      // Service booking deposit — notify business owner
      console.log(`Service deposit received from ${customerEmail}`);
      await sendBookingNotification({ customerEmail, customerName, session });
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const sub = stripeEvent.data.object;
    console.log(`Subscription cancelled: ${sub.id}`);
    // TODO: deactivate portal access for this customer
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

async function sendDownloadEmail({ customerEmail, customerName, productKey, downloadUrl }) {
  const PRODUCT_NAMES = {
    'template-pack':     'Drone Inspection Report Template Pack',
    'sow-template':      'Construction Monitoring SOW Template',
    'pricing-calc':      'Aerial Photography Pricing Calculator',
    'tx-guide':          'Texas Drone Regulations & Permit Guide',
    'client-agreement':  'Real Estate Drone Client Agreement',
    'flight-checklist':  'Drone Flight Planning Checklist Pack',
  };

  const productName = PRODUCT_NAMES[productKey] || productKey;

  // Post to ceezaer-automation server to send via Zoho Mail
  try {
    const automationUrl = process.env.AUTOMATION_SERVER_URL;
    if (!automationUrl) { console.warn('AUTOMATION_SERVER_URL not set — skipping email'); return; }

    await fetch(`${automationUrl}/api/send-download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AUTOMATION_API_KEY || '',
      },
      body: JSON.stringify({ customerEmail, customerName, productName, downloadUrl }),
    });
  } catch (err) {
    console.error('Failed to send download email:', err.message);
  }
}

async function sendPlatformWelcomeEmail({ customerEmail, customerName, sessionId }) {
  try {
    const automationUrl = process.env.AUTOMATION_SERVER_URL;
    if (!automationUrl) return;

    await fetch(`${automationUrl}/api/platform-activated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AUTOMATION_API_KEY || '',
      },
      body: JSON.stringify({ customerEmail, customerName, sessionId }),
    });
  } catch (err) {
    console.error('Failed to send platform welcome email:', err.message);
  }
}

async function sendBookingNotification({ customerEmail, customerName, session }) {
  try {
    const automationUrl = process.env.AUTOMATION_SERVER_URL;
    if (!automationUrl) return;

    await fetch(`${automationUrl}/api/booking-deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AUTOMATION_API_KEY || '',
      },
      body: JSON.stringify({
        customerEmail,
        customerName,
        amount: session.amount_total,
        sessionId: session.id,
        productName: session.metadata?.productName,
      }),
    });
  } catch (err) {
    console.error('Failed to send booking notification:', err.message);
  }
}
