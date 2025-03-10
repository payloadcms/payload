# S3 Storage for Payload

This package provides a simple way to use S3 with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-s3
```

## Usage

- Configure the `collections` object to specify which collections should use the AWS S3 adapter. The slug _must_ match one of your existing collection slugs.
- The `config` object can be any [`S3ClientConfig`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3) object (from [`@aws-sdk/client-s3`](https://github.com/aws/aws-sdk-js-v3)). _This is highly dependent on your AWS setup_. Check the AWS documentation for more information.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client. You must allow CORS PUT method for the bucket to your website.

```ts
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    s3Storage({
      collections: {
        media: true,
        'media-with-prefix': {
          prefix,
        },
      },
      bucket: process.env.S3_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        region: process.env.S3_REGION,
        // ... Other S3 configuration
      },
    }),
  ],
})
```

### Configuration Options

See the the [AWS SDK Package](https://github.com/aws/aws-sdk-js-v3) and [`S3ClientConfig`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3) object for guidance on AWS S3 configuration.
