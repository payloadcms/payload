# Payload Commerce

Welcome to the official Payload ecommerce template! **Still work in progress** so this readme is going to be light in details. Full release ETA early Q1 in 2025. This current iteration is lacking polish, final design, assets and a few planned features. The core workflow works with variants, Stripe checkout and more though.

To get setup it's gonna require you to copy the `.env.example` file into `.env` and add the missing variables. The most important ones are the Stripe ones.

Full tutorial and documentation will follow.

## Features

- Products with variants, custom pricing
- User accounts with cart sync
- Guest checkout
- Viewing order history (as guest too)
- Building pages with blocks
- Static generation of pages with on demand revalidation
- Live preview

Planned for the future:

- Alternative payment providers
- Designed email templates

## Stripe

You need to log into your Stripe dashboard and get your publishable and private keys for the env var. Once that's ready you should setup the stripe CLI locally and run `stripe login`, then the following command to setup webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This will give you the webhooks secret for testing locally too
