# Sentry Plugin for Payload

This plugin seamlessly integrates [Sentry](https://sentry.io/) with [Payload](https://github.com/payloadcms/payload) for performance monitoring and error tracking.

## Installation

```bash
  yarn add @payloadcms/plugin-sentry
  # OR
  npm i @payloadcms/plugin-sentry
```

## Basic Usage

1. Import `sentry` from `'@payloadcms/plugin-sentry'`
2. Add it to the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview)
3. Pass in your Data Source Name (DSN)
4. Pass [additional options](#additional-options) - _not required_

```js
import { buildConfig } from 'payload/config'
import { sentry } from '@payloadcms/plugin-sentry'
import { Pages, Media } from './collections'

const config = buildConfig({
  collections: [Pages, Media],
  plugins: [
    sentry({
      dsn: 'https://61edebas777889984d323d777@o4505289711681536.ingest.sentry.io/4505357433352176',
    }),
  ],
})

export default config
```

## Options

### Data Source Name (DSN) and where to find it

- `dsn` : string | required

  Sentry automatically assigns a DSN when you create a project, the unique DSN informs Sentry where to send events so they are associated with the correct project.

  #### :rotating_light: You can find the DSN in your project settings by navigating to [Project] > Settings > Client Keys (DSN) in [sentry.io](sentry.io).

### Additional Options

- `enabled`: boolean | optional

  Set to false to disable the plugin. Defaults to true.

- `init` : ClientOptions | optional

  Sentry allows a variety of options to be passed into the Sentry.init() function, see the full list of options [here](https://docs.sentry.io/platforms/node/guides/express/configuration/options).

- `requestHandler` : RequestHandlerOptions | optional

  Accepts options that let you decide what data should be included in the event sent to Sentry, checkout the options [here](https://docs.sentry.io/platforms/node/guides/express/configuration/options).

- `captureErrors`: number[] | optional

  By default, `Sentry.errorHandler` will capture only errors with a status code of 500 or higher. To capture additional error codes, pass the values as numbers in an array.

You can configure any of these options by passing them to the plugin under options:

```js
import { buildConfig } from 'payload/config'
import { sentry } from '@payloadcms/plugin-sentry'
import { Pages, Media } from './collections'

const config = buildConfig({
  collections: [Pages, Media],
  plugins: [
    sentry({
      dsn: 'https://61edebas777889984d323d777@o4505289711681536.ingest.sentry.io/4505357433352176',
      options: {
        init: {
          debug: true,
          environment: 'development',
          tracesSampleRate: 1.0,
        },
        requestHandler: {
          serverName: false,
          user: ['email'],
        },
        captureErrors: [400, 403, 404],
      },
    }),
  ],
})

export default config
```

To learn more about these options and when to use them, visit the [Sentry Docs](https://docs.sentry.io/platforms/node/guides/express/configuration/options).

## TypeScript

All types can be directly imported:

```js
import { PluginOptions } from '@payloadcms/plugin-sentry/types'
```

## Development

To actively develop or debug this plugin you can either work directly within the demo directory of this repo, or link your own project.

#### Internal Demo

This repo includes a demo of Payload that installs the plugin directly from the source code. This is the easiest way to get started. To spin up this demo, follow these steps:

1.  First clone the repo
2.  Then, `cd plugin-sentry && yarn && cd dev && yarn && yarn dev`
3.  Now open `http://localhost:3000/admin` in your browser
4.  Create a new user and sign in
5.  Use the buttons to throw test errors

That's it! Changes made in `./src` will be reflected in the demo.
