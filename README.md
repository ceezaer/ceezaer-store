# Ceezaer Drone Store

Stan Store-style product page for Ceezaer Drone Services.

## Files
- `index.html` — The full store page (hero, products, testimonials, FAQ, booking modal)
- `marketing.md` — Social captions, email templates, ad copy
- `README.md` — This file

## Deploy Options

### Option 1: Netlify (Free, instant)
1. Go to netlify.com → drag & drop the `ceezaer-store/` folder
2. You get a URL like `ceezaer-store.netlify.app`
3. Add a custom domain: `store.ceezaer.com`

### Option 2: GitHub Pages (Free)
1. Push folder to a GitHub repo
2. Settings → Pages → Deploy from main branch

### Option 3: Serve from ceezaer-automation (Render)
Add a static route in `src/routes/api.js` to serve `index.html`
at `/store` — or just copy `index.html` to a `public/` folder.

## Booking Form Integration
The booking modal currently posts to your ceezaer.com Netlify form.
To wire it to your automation server instead, change `fetch()` in the
script section of `index.html` to point to:
  `https://your-render-url.onrender.com/webhook/booking`

Then add a webhook handler in `src/webhooks/` that creates a CRM lead
and sends a confirmation email via Zoho.

## Customization
- Swap testimonials with real client quotes as you collect them
- Replace emoji product images with real drone photos
- Update pricing in both the product cards and the modal select options
- Add your Google Analytics / Meta Pixel ID in the <head>
