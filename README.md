# Payload Cloud Plugin

This is the official Payload Cloud plugin that connects your Payload instance to the resources that Payload Cloud provides.

## File storage

Payload Cloud gives you S3 file storage backed by Cloudflare as a CDN, and this plugin extends Payload so that all of your media will be stored in S3 rather than locally.

## Email delivery

Payload Cloud provides an email delivery service out-of-the-box for all Payload Cloud customers. Powered by [Resend](https://resend.com).

## Upload caching

Payload Cloud provides a caching for all upload collections by default through Cloudflare's CDN.

## How to use

Add the plugin to your Payload config

`yarn add @payloadcms/plugin-cloud`

```ts
import { payloadCloud } from '@payloadcms/plugin-cloud'
import { buildConfig } from 'payload/config'

export default buildConfig({
  plugins: [payloadCloud()]
  // rest of config
})
```

NOTE: If your Payload config already has an email with transport, this will take precedence over Payload Cloud's email service.

### Optional configuration

If you wish to opt-out of any Payload cloud features, the plugin also accepts options to do so.

```ts
payloadCloud({
  storage: false, // Disable file storage
  email: false,   // Disable email delivery
  uploadCaching: false // Disable upload caching
})
```

#### Upload Caching Configuration

If you wish to configure upload caching on a per-collection basis, you can do so by passing in a keyed object of collection names. By default, all collections will be cached for 24 hours (86400 seconds). The cache is invalidated when an item is updated or deleted.

```ts
payloadCloud({
  uploadCaching: {
    maxAge: 604800, // Override default maxAge for all collections
    collection1Slug: {
      maxAge: 10 // Collection-specific maxAge, takes precedence over others
    },
    collection2Slug: {
      enabled: false // Disable caching for this collection
    }
  }
})
```

### Accessing File Storage from Local Environment

This plugin works off of a specific set of environment variables in order to access your file resources. Here is this list with some prefilled.

```txt
PORT=3000
MONGODB_URI=
PAYLOAD_CLOUD=true
PAYLOAD_CLOUD_ENVIRONMENT=prod
PAYLOAD_CLOUD_BUCKET=
PAYLOAD_CLOUD_COGNITO_IDENTITY_POOL_ID=
PAYLOAD_CLOUD_COGNITO_USER_POOL_CLIENT_ID=
PAYLOAD_CLOUD_COGNITO_USER_POOL_ID=
PAYLOAD_CLOUD_PROJECT_ID=
PAYLOAD_CLOUD_COGNITO_PASSWORD=
PAYLOAD_CLOUD_BUCKET_REGION=

PAYLOAD_SECRET=
```

- `MONGODB_URI` is on the the Database tab.
- `PAYLOAD_CLOUD_PROJECT_ID` is from Settings -> Billing.
- `PAYLOAD_SECRET` is from Settings -> Environment Variables

The remaining values can be seen on your project's File Storage tab. You'll have to match up the values appropriately. We plan on adding the ability to easily copy these values in the near future.

## Future enhancements

### API CDN

In the future, this plugin will also ship with a way to dynamically cache API requests as well as purge them whenever a resource is updated.

## When it executes

This plugin will only execute if the required environment variables set by Payload Cloud are in place. If they are not, the plugin will not execute and your Payload instance will behave as normal.
