/**
 * Netlify Function: get-download
 * Serves secure, time-limited download links for digital products.
 *
 * The token encodes: productKey:sessionId:timestamp (base64url)
 * Links expire after 72 hours.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   DOWNLOAD_BASE_URL  (e.g., https://storage.googleapis.com/ceezaer-products)
 *                      Or use any CDN/S3/R2 bucket URL where files are stored.
 *
 * File naming convention in your storage bucket:
 *   template-pack.zip
 *   sow-template.pdf
 *   pricing-calc.xlsx
 *   tx-guide.pdf
 *   client-agreement.pdf
 *   flight-checklist.pdf
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

const PRODUCT_FILES = {
  'template-pack':    'template-pack.zip',
  'sow-template':     'sow-template.pdf',
  'pricing-calc':     'pricing-calc.xlsx',
  'tx-guide':         'tx-guide.pdf',
  'client-agreement': 'client-agreement.pdf',
  'flight-checklist': 'flight-checklist.pdf',
};

const PRODUCT_NAMES = {
  'template-pack':    'Drone Inspection Report Template Pack',
  'sow-template':     'Construction Monitoring SOW Template',
  'pricing-calc':     'Aerial Photography Pricing Calculator',
  'tx-guide':         'Texas Drone Regulations Guide',
  'client-agreement': 'Real Estate Drone Client Agreement',
  'flight-checklist': 'Drone Flight Planning Checklist Pack',
};

exports.handler = async (event) => {
  const { token } = event.queryStringParameters || {};

  if (!token) {
    return errorPage('Missing download token.');
  }

  let productKey, sessionId, timestamp;
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    [productKey, sessionId, timestamp] = decoded.split(':');
  } catch {
    return errorPage('Invalid download token.');
  }

  // Check expiry
  if (!timestamp || Date.now() - Number(timestamp) > EXPIRY_MS) {
    return errorPage('This download link has expired. Please contact info@ceezaer.com for a new link.');
  }

  // Validate the Stripe session was actually paid
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return errorPage('Payment not confirmed. Please contact info@ceezaer.com.');
    }
  } catch (err) {
    return errorPage('Could not verify payment. Please contact info@ceezaer.com.');
  }

  const fileName = PRODUCT_FILES[productKey];
  const productName = PRODUCT_NAMES[productKey];

  if (!fileName) {
    return errorPage('Unknown product.');
  }

  const baseUrl = process.env.DOWNLOAD_BASE_URL;
  if (!baseUrl) {
    // Fallback: show a nice page asking them to email for the file
    return fallbackPage(productName);
  }

  const fileUrl = `${baseUrl}/${fileName}`;

  // Redirect to the actual file (can be a pre-signed S3/R2 URL or direct CDN link)
  return {
    statusCode: 302,
    headers: { Location: fileUrl },
    body: '',
  };
};

function errorPage(message) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'text/html' },
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Download Error — Ceezaer</title>
<style>body{font-family:Inter,sans-serif;background:#0a0a0f;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;}
.box{max-width:480px;}.icon{font-size:3rem;margin-bottom:1rem;}h1{font-size:1.5rem;margin-bottom:1rem;}p{color:#888;line-height:1.7;}a{color:#00C6FF;}</style></head>
<body><div class="box"><div class="icon">⚠️</div><h1>Download Unavailable</h1><p>${message}</p>
<p style="margin-top:1.5rem;"><a href="https://ceezaer.com">← Back to Ceezaer</a></p></div></body></html>`,
  };
}

function fallbackPage(productName) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Download Ready — Ceezaer</title>
<style>body{font-family:Inter,sans-serif;background:#0a0a0f;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;}
.box{max-width:520px;}.icon{font-size:3rem;margin-bottom:1rem;}h1{font-size:1.5rem;margin-bottom:1rem;}p{color:#888;line-height:1.7;}a{color:#00C6FF;}</style></head>
<body><div class="box"><div class="icon">📦</div><h1>Your Download is Ready</h1>
<p>Thank you for purchasing <strong style="color:#f0f0f0">${productName}</strong>.</p>
<p>We'll email your download link to the address you used at checkout within 5 minutes.</p>
<p>Questions? <a href="mailto:info@ceezaer.com">info@ceezaer.com</a></p>
<p style="margin-top:1.5rem;"><a href="https://ceezaer.com">← Back to Ceezaer</a></p></div></body></html>`,
  };
}
