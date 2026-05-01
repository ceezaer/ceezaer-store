/**
 * Netlify Function: stripe-prices
 * Returns the public Stripe Price IDs so the frontend JS can use them.
 * Only exposes Price IDs (not secret keys) — safe to return to the browser.
 *
 * The frontend calls: GET /.netlify/functions/stripe-prices
 * Then passes the priceId to create-checkout.
 *
 * Set these in Netlify dashboard → Site settings → Environment variables.
 */

exports.handler = async () => {
  const prices = {
    // Digital products
    STRIPE_PRICE_TEMPLATE_PACK:    process.env.STRIPE_PRICE_TEMPLATE_PACK    || '',
    STRIPE_PRICE_SOW_TEMPLATE:     process.env.STRIPE_PRICE_SOW_TEMPLATE     || '',
    STRIPE_PRICE_PRICING_CALC:     process.env.STRIPE_PRICE_PRICING_CALC     || '',
    STRIPE_PRICE_TX_GUIDE:         process.env.STRIPE_PRICE_TX_GUIDE         || '',
    STRIPE_PRICE_CLIENT_AGREEMENT: process.env.STRIPE_PRICE_CLIENT_AGREEMENT || '',
    STRIPE_PRICE_FLIGHT_CHECKLIST: process.env.STRIPE_PRICE_FLIGHT_CHECKLIST || '',
    // Platform subscriptions
    STRIPE_PRICE_PLATFORM_STARTER: process.env.STRIPE_PRICE_PLATFORM_STARTER || '',
    STRIPE_PRICE_PLATFORM_GROWTH:  process.env.STRIPE_PRICE_PLATFORM_GROWTH  || '',
    // Service deposits
    STRIPE_PRICE_DEPOSIT_REALESTATE:   process.env.STRIPE_PRICE_DEPOSIT_REALESTATE   || '',
    STRIPE_PRICE_DEPOSIT_ROOF:         process.env.STRIPE_PRICE_DEPOSIT_ROOF         || '',
    STRIPE_PRICE_DEPOSIT_CONSTRUCTION: process.env.STRIPE_PRICE_DEPOSIT_CONSTRUCTION || '',
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // cache 5 min
    },
    body: JSON.stringify(prices),
  };
};
