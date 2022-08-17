# Payload Stripe Plugin

[![NPM](https://img.shields.io/npm/v/@payloadcms/plugin-stripe)](https://www.npmjs.com/package/@payloadcms/plugin-stripe)

A plugin for [Payload CMS](https://github.com/payloadcms/payload) to manage a [Stripe](https://stripe.com/) account through Payload.

Core features:
  - Enables two-way data sync between Stripe and Payload
  - Provides Payload access control to the Stripe API
  - Opens custom routes to interface with the Stripe API

## Installation

```bash
  yarn add @payloadcms/plugin-stripe
  # OR
  npm i @payloadcms/plugin-stripe
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config';
import stripe from '@payloadcms/plugin-stripe';

const config = buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: []
    },
  ],
  plugins: [
    stripe({

    })
  ]
});

export default config;
```

### Options

- `lorem`

    Lorem ipsum

  ## TypeScript

  All types can be directly imported:

  ```js
  import {
    StripeConfig
   } from '@payloadcms/plugin-stripe/dist/types';
  ```

  ## Screenshots

  <!-- ![screenshot 1](https://github.com/@payloadcms/plugin-stripe/blob/main/images/screenshot-1.jpg?raw=true) -->
