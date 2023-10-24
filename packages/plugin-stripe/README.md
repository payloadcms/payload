# Payload Stripe Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-stripe)](https://www.npmjs.com/package/@payloadcms/plugin-stripe)

A plugin for [Payload](https://github.com/payloadcms/payload) to connect [Stripe](https://stripe.com) and Payload.

Core features:

- Hides your Stripe credentials when shipping SaaS applications
- Allows restricted keys through [Payload access control](https://payloadcms.com/docs/access-control/overview)
- Enables a two-way communication channel between Stripe and Payload
  - Proxies the [Stripe REST API](https://stripe.com/docs/api)
  - Proxies [Stripe webhooks](https://stripe.com/docs/webhooks)
- Automatically syncs data between the two platforms

## Installation

```bash
  yarn add @payloadcms/plugin-stripe
  # OR
  npm i @payloadcms/plugin-stripe
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config'
import stripePlugin from '@payloadcms/plugin-stripe'

const config = buildConfig({
  plugins: [
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    }),
  ],
})

export default config
```

### Options

- `stripeSecretKey`: string

  Required. Your Stripe secret key.

- `sync`: array

  Optional. An array of sync configs. This will automatically configure a sync between Payload collections and Stripe resources on create, delete, and update. See [sync](#sync) for more details.

- `stripeWebhooksEndpointSecret`: string

  Optional. Your Stripe webhook endpoint secret. This is needed only if you wish to sync data _from_ Stripe _to_ Payload.

- `rest`: boolean

  Optional. When `true`, opens the `/api/stripe/rest` endpoint. See [endpoints](#endpoints) for more details.

- `webhooks`: object | function

  Optional. Either a function to handle all webhooks events, or an object of Stripe webhook handlers, keyed to the name of the event. See [webhooks](#webhooks) for more details or for a list of all available webhooks, see [here](https://stripe.com/docs/cli/trigger#trigger-event).

- `logs`: boolean

  Optional. When `true`, logs sync events to the console as they happen.

## Sync

This option will setup a basic sync between Payload collections and Stripe resources for you automatically. It will create all the necessary hooks and webhooks handlers, so the only thing you have to do is map your Payload fields to their corresponding Stripe properties. As documents are created, updated, and deleted from either Stripe or Payload, the changes are reflected on either side.

> NOTE: If you wish to enable a _two-way_ sync, be sure to setup [`webhooks`](#webhooks) and pass the `stripeWebhooksEndpointSecret` through your config.

> NOTE: Due to limitations in the Stripe API, this currently only works with top-level fields. This is because every Stripe object is a separate entity, making it difficult to abstract into a simple reusable library. In the future, we may find a pattern around this. But for now, cases like that will need to be hard-coded. See the [demo](./demo) for an example of this.

```js
import { buildConfig } from 'payload/config'
import stripePlugin from '@payloadcms/plugin-stripe'

const config = buildConfig({
  plugins: [
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET,
      sync: [
        {
          collection: 'customers',
          stripeResourceType: 'customers',
          stripeResourceTypeSingular: 'customer',
          fields: [
            {
              fieldPath: 'name', // this is a field on your own Payload config
              stripeProperty: 'name', // use dot notation, if applicable
            },
          ],
        },
      ],
    }),
  ],
})

export default config
```

Using `sync` will do the following:

- Adds and maintains a `stripeID` read-only field on each collection, this is a field generated _by Stripe_ and used as a cross-reference
- Adds a direct link to the resource on Stripe.com
- Adds and maintains an `skipSync` read-only flag on each collection to prevent infinite syncs when hooks trigger webhooks
- Adds the following hooks to each collection:
  - `beforeValidate`: `createNewInStripe`
  - `beforeChange`: `syncExistingWithStripe`
  - `afterDelete`: `deleteFromStripe`
- Handles the following Stripe webhooks
  - `STRIPE_TYPE.created`: `handleCreatedOrUpdated`
  - `STRIPE_TYPE.updated`: `handleCreatedOrUpdated`
  - `STRIPE_TYPE.deleted`: `handleDeleted`

### Endpoints

The following custom endpoints are automatically opened for you:

> NOTE: the `/api` part of these routes may be different based on the settings defined in your Payload config.

- #### `POST /api/stripe/rest`

  If `rest` is true, proxies the [Stripe REST API](https://stripe.com/docs/api) behind [Payload access control](https://payloadcms.com/docs/access-control/overview) and returns the result. If you need to proxy the API server-side, use the [stripeProxy](#node) function.

  ```js
  const res = await fetch(`/api/stripe/rest`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `JWT ${token}` // NOTE: do this if not in a browser (i.e. curl or Postman)
    },
    body: JSON.stringify({
      stripeMethod: 'stripe.subscriptions.list',
      stripeArgs: [
        {
          customer: 'abc',
        },
      ],
    }),
  })
  ```

- #### `POST /stripe/webhooks`

  Returns an http status code. This is where all Stripe webhook events are sent to be handled. See [webhooks](#webhooks).

### Webhooks

[Stripe webhooks](https://stripe.com/docs/webhooks) are used to sync from Stripe to Payload. Webhooks listen for events on your Stripe account so you can trigger reactions to them. Follow the steps below to enable webhooks.

Development:

1. Login using Stripe cli `stripe login`
1. Forward events to localhost `stripe listen --forward-to localhost:3000/stripe/webhooks`
1. Paste the given secret into your `.env` file as `STRIPE_WEBHOOKS_ENDPOINT_SECRET`

Production:

1. Login and [create a new webhook](https://dashboard.stripe.com/test/webhooks/create) from the Stripe dashboard
1. Paste `YOUR_DOMAIN_NAME/api/stripe/webhooks` as the "Webhook Endpoint URL"
1. Select which events to broadcast
1. Paste the given secret into your `.env` file as `STRIPE_WEBHOOKS_ENDPOINT_SECRET`
1. Then, handle these events using the `webhooks` portion of this plugin's config:

```js
import { buildConfig } from 'payload/config'
import stripePlugin from '@payloadcms/plugin-stripe'

const config = buildConfig({
  plugins: [
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET,
      webhooks: {
        'customer.subscription.updated': ({ event, stripe, stripeConfig }) => {
          // do something...
        },
      },
      // NOTE: you can also catch all Stripe webhook events and handle the event types yourself
      // webhooks: (event, stripe, stripeConfig) => {
      //   switch (event.type): {
      //     case 'customer.subscription.updated': {
      //       // do something...
      //       break;
      //     }
      //     default: {
      //       break;
      //     }
      //   }
      // }
    }),
  ],
})

export default config
```

For a full list of available webhooks, see [here](https://stripe.com/docs/cli/trigger#trigger-event).

### Node

On the server you should interface with Stripe directly using the [stripe](https://www.npmjs.com/package/stripe) npm module. That might look something like this:

```js
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' })

export const MyFunction = async () => {
  try {
    const customer = await stripe.customers.create({
      email: data.email,
    })

    // do something...
  } catch (error) {
    console.error(error.message)
  }
}
```

Alternatively, you can interface with the Stripe using the `stripeProxy`, which is exactly what the `/api/stripe/rest` endpoint does behind-the-scenes. Here's the same example as above, but piped through the proxy:

```js
import { stripeProxy } from '@payloadcms/plugin-stripe'

export const MyFunction = async () => {
  try {
    const customer = await stripeProxy({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeMethod: 'customers.create',
      stripeArgs: [
        {
          email: data.email,
        },
      ],
    })

    if (customer.status === 200) {
      // do something...
    }

    if (customer.status >= 400) {
      throw new Error(customer.message)
    }
  } catch (error) {
    console.error(error.message)
  }
}
```

## TypeScript

All types can be directly imported:

```js
import {
  StripeConfig,
  StripeWebhookHandler,
  StripeProxy,
  ...
} from '@payloadcms/plugin-stripe/types';
```

### Development

For development purposes, there is a full working example of how this plugin might be used in the [demo](./demo) of this repo. This demo can be developed locally using any Stripe account, you just need a working API key. Then:

```bash
git clone git@github.com:payloadcms/plugin-stripe.git \
  cd plugin-stripe && yarn \
  cd demo && yarn \
  cp .env.example .env \
  vim .env \ # add your Stripe creds to this file
  yarn dev
```

Now you have a running Payload server with this plugin installed, so you can authenticate and begin hitting the routes. To do this, open [Postman](https://www.postman.com/) and import [our config](https://github.com/payloadcms/plugin-stripe/blob/main/src/payload-stripe-plugin.postman_collection.json). First, login to retrieve your Payload access token. This token is automatically attached to the header of all other requests.

## Screenshots

  <!-- ![screenshot 1](https://github.com/@payloadcms/plugin-stripe/blob/main/images/screenshot-1.jpg?raw=true) -->
