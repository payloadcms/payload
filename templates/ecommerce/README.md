# Payload E-Commerce Template

This is a [Payload](https://github.com/payloadcms/payload) template to power e-commerce businesses and online stores. This repo includes a fully-working backend, enterprise-grade admin panel, and a beautifully designed, production-ready website.

This template is right for you if you are selling:

- Physical products like clothing or merchandise
- Digital assets like ebooks or videos
- Access to content like courses or premium articles

Core features:

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Shopping Cart](#shopping-cart)
- [Checkout](#checkout)
- [Paywall](#paywall)
- [Layout Builder](#layout-builder)
- [SEO](#seo)
- [Website](#website)

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

#### Method 1 (recommended)

  Go to Payload Cloud and [clone this template](https://payloadcms.com/new/clone/ecommerce). This will create a new repository on your GitHub account with this template's code which you can then clone to your own machine.

#### Method 2

  Use the `create-payload-app` CLI to clone this template directly to your machine:

    npx create-payload-app my-project -t ecommerce

#### Method 3

  Use the `git` CLI to clone this template directly to your machine:

    git clone -n --depth=1 --filter=tree:0 https://github.com/payloadcms/payload my-project && cd my-project && git sparse-checkout set --no-cone templates/ecommerce && git checkout && rm -rf .git && git init && git add . && git mv -f templates/ecommerce/{.,}* . && rm -rf templates && git add . && git commit -m "Initial commit"

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `yarn && yarn dev` to install dependencies and start the dev server
1. `open http://localhost:3000` to access the admin panel

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. See [Production](#production) for how to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

The Payload config is tailored specifically to the needs of most e-commerce businesses. It is pre-configured in the following ways:

### Collections

See the [collections documentation](https://payloadcms.com/docs/configuration/collections) for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled and encompass both admins and customers based on the value of their `roles` field. Only `admin` users can access your admin panel to manage your store whereas `customer` can authenticate on your front-end to create [shopping carts](#shopping-cart) and place [orders](#orders) but have limited access to the platform. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/master/examples/auth/cms#readme) or the [authentication docs](https://payloadcms.com/docs/authentication/overview#authentication-overview).

- #### Products

  Each product is linked to Stripe via a custom select field that is dynamically populated in the sidebar. This field fetches all available products in the background and displays them as options. Once a product has been selected, prices get automatically synced between Stripe and Payload through webhooks. See [Stripe](#stripe) for more details.

  All products are layout-builder enabled so you can generate unique pages for each product using layout-building blocks, see [Layout Builder](#layout-builder) for more details.

  Products can also gate their content or digital assets behind a paywall, see [Paywall](#paywall) for more details.

- #### Pages

  All pages are layout-builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details.

- #### Media

  This is the uploads-enabled collection used by products and pages to contain media, etc.

- #### Categories

  A taxonomy used to group products together. Categories can be nested inside of one another, for example "Shirts > Red". See the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) for more details.

### Globals

See the [globals documentation](https://payloadcms.com/docs/configuration/globals) for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end, i.e. nav links, etc.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic role-based access control is setup to determine what users can and cannot do based on their roles, which are:

- `admin`: They can access the Payload admin panel to manage your store. They can see all data and make all operations.
- `customer`: They cannot access the Payload admin panel and have a limited access to operations based on their user (see below).

This applies to each collection in the following ways:

- `users`: Only admins and the user themselves can access their profile. Anyone can create a user but only admins can delete users.
- `products`: Everyone can access products, but only admins can create, update, or delete them. Paywall-enabled products may also have content that is only accessible by users who have purchased the product. See [Paywall](#paywall) for more details.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Shopping cart

Logged-in users can have their shopping carts saved to their profiles as they shop. This way they can continue shopping at a later date or on another device. When not logged in, the cart can be saved to local storage and synced to Payload on the next login. This works by maintaining a `cart` field on the `user`:

```ts
{
  name: 'cart',
  label: 'Shopping Cart',
  type: 'object',
  fields: [
    {
      name: 'items',
      label: 'Items',
      type: 'array',
      fields: [
        // product, quantity, etc
      ]
    },
    // other metadata like `createdOn`, etc
  ]
}
```

## Stripe

Payload itself handles no currency exchange. All payments are processed and billed using [Stripe](https://stripe.com). This means you must have access to a Stripe account via an API key, see [Connect Stripe](#connect-stripe) for how to get one. When you create a product in Payload that wish to sell, it must be connected to a Stripe product by selecting one from the field in the product's sidebar. This field fetches all available products in the background and displays them as options, see [Products](#products) for more details. Once set, data is automatically synced between the two platforms in the following ways:

1. Stripe to Payload using [Stripe Webhooks](https://stripe.com/docs/webhooks):
   - `product.created`
   - `product.updated`
   - `price.updated`

1. Payload to Stripe using [Payload Hooks](https://payloadcms.com/docs/hooks/overview):
   - `user.create`

For more details on how to extend this functionality, see the the official [Payload Stripe Plugin](https://github.com/payloadcms/plugin-stripe).

## Checkout

A custom endpoint is opened at `/api/payment-intent` which initiates the checkout process. This endpoint creates a [`PaymentIntent`](https://stripe.com/docs/payments/payment-intents) with the items in the cart using the Stripe's [Invoices API](https://stripe.com/docs/api/invoices). First, an invoice is drafted, then each item in your cart is appended as a line-item to the invoice. The total price is recalculated on the server to ensure accuracy and security, and once completed, passes the `client_secret` back in the response for your front-end to finalize the payment. Once the payment has succeeded, the draft invoice will be set to paid, each purchased product will be recorded to the user's profile, and the user's cart will be cleared.

## Orders

  When an order is placed, an invoice is created in Stripe. To easily query orders from Stripe, two custom endpoints are opened which proxy the Stripe API for these invoices. This allows you to safely query Stripe from your front-end without exposing your sensitive Stripe API key.

  - `/api/users/orders` - Returns all orders for the current user
  - `/api/users/orders/:id` - Returns a single order by ID

  For more details on how to extend this functionality, see the [Custom Endpoints](https://payloadcms.com/docs/rest-api/overview#custom-endpoints) docs.

## Paywall

Products can optionally restrict access to content or digital assets behind a paywall. This will require the product to be purchased before it's resources are accessible. To do this, a `purchases` field is maintained on each user to determine their access:

```ts
{
  name: 'purchases',
  label: 'Purchases',
  type: 'array',
  fields: [
    {
      name: 'product',
      label: 'Product',
      type: 'relationship',
      relationTo: 'products',
    },
    // other metadata like `createdOn`, etc
  ]
}
```

Then, a `paywall` field can be added to the `product` with `read` access control set to check for associated purchases. Every time a user requests a product, this will only return data to those who have purchased it:

```ts
{
  name: 'paywall',
  label: 'Paywall',
  type: 'blocks',
  access: {
    read: checkUserPurchases,
  },
  fields: [
    // assets
  ]
}
```

## Layout builder

Create unique product and page layouts for any type fo content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://github.com/payloadcms/plugin-seo) for complete SEO control.

## Website

This template includes a fully-working [Next.js](https://nextjs.org) front-end that is served alongside your Payload app in a single Express server. This makes is so that you can deploy both apps simultaneously and host them together. If you prefer a different front-end framework, this pattern works for any framework that supports a custom server. You can easily [Eject](#eject) the front-end out from this template to swap in your own or to use it as a standalone CMS. For more details, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/master/examples/custom-server).

Core features:

- [Next.js App Router](https://nextjs.org)
- [GraphQL](https://graphql.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- Complete authentication workflow
- Complete shopping experience
- Shopping cart
- Full checkout workflow
- Customer dashboards
- Dark mode
- Pre-made layout building blocks
- [Payload Admin Bar](https://github.com/payloadcms/payload-admin-bar)
- Complete SEO configuration
- Complete Stripe integration
- Conditionally rendered paywall content

### Eject

If you prefer another front-end framework or would like to use Payload as a standalone CMS, you can easily eject the front-end from this template. To eject, simply run `yarn eject`. This will uninstall all Next.js related dependencies and delete all files and folders related to the Next.js front-end. It also removes all custom routing from your `server.ts` file and updates your `eslintrc.js`.

> Note: Your eject script may not work as expected if you've made significant modifications to your project. If you run into any issues, compare your project's dependencies and file structure with this template, see [./src/eject](./src/eject) for full details.

For more details on how setup a custom server, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/master/examples/custom-server).

##  Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Connect Stripe

To integrate with Stripe, follow these steps:

1. You will first need to create a [Stripe](https://stripe.com) account if you do not already have one.
1. Retrieve your Stripe Secret Key from the Stripe admin panel and paste it into your `env`:
   ```bash
   STRIPE_SECRET_KEY=
   ```
1. In another terminal, listen for webhooks:
   ```bash
   stripe login # follow the prompts
   yarn stripe:webhooks
   ```
1. Paste the given webhook signing secret into your `env`:
   ```bash
   STRIPE_WEBHOOKS_SIGNING_SECRET=
   ```
1. Reboot Payload to ensure that Stripe connects and the webhooks are registered.

See the official [Payload Stripe Plugin](https://github.com/payloadcms/plugin-stripe) for more details.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few products and pages you can run `yarn seed`. This template also comes with a `/api/seed` endpoint you can use to seed the database from the admin panel.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
