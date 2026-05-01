/**
 * Netlify Function: create-checkout
 * Creates a Stripe Checkout Session and returns the checkout URL.
 *
 * POST body: { priceId, mode, productName, successPath, cancelPath }
 *   mode: "payment" (one-time) | "subscription" (recurring)
 *
 * Required env vars (set in Netlify dashboard):
 *   STRIPE_SECRET_KEY
 *   URL  (auto-set by Netlify — your site's base URL)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = new Set([
  // Digital products
  process.env.STRIPE_PRICE_TEMPLATE_PACK,
  process.env.STRIPE_PRICE_SOW_TEMPLATE,
  process.env.STRIPE_PRICE_PRICING_CALC,
  process.env.STRIPE_PRICE_TX_GUIDE,
  process.env.STRIPE_PRICE_CLIENT_AGREEMENT,
  process.env.STRIPE_PRICE_FLIGHT_CHECKLIST,
  // Platform subscriptions
  process.env.STRIPE_PRICE_PLATFORM_STARTER,
  process.env.STRIPE_PRICE_PLATFORM_GROWTH,
  // Service deposits
  process.env.STRIPE_PRICE_DEPOSIT_REALESTATE,
  process.env.STRIPE_PRICE_DEPOSIT_ROOF,
  process.env.STRIPE_PRICE_DEPOSIT_CONSTRUCTION,
  process.env.STRIPE_PRICE_DEPOSIT_MAPPING,
  process.env.STRIPE_PRICE_DEPOSIT_CINEMA,
].filter(Boolean));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { priceId, mode = 'payment', productName, successPath = '/success', cancelPath = '/cancel' } = body;

  if (!priceId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing priceId' }) };
  }

  // Whitelist check — never allow arbitrary Stripe price IDs
  if (!ALLOWED_PRICES.has(priceId)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Price not permitted' }) };
  }

  const baseUrl = process.env.URL || 'https://ceezaer.com';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}${cancelPath}`,
      metadata: { productName: productName || '' },
      // Collect billing address for tax purposes
      billing_address_collection: 'auto',
      // Allow promo codes
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};
