# Aliyun OSS Storage for Payload

This package provides a simple way to use Aliyun OSS with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-aliyun-oss
```

## Usage

- Configure the `collections` object to specify which collections should use the Aliyun OSS adapter. The slug _must_ match one of your existing collection slugs.
- The `options` object can be any [`Options`](https://github.com/ali-sdk/ali-oss?tab=readme-ov-file#ossoptions) object (from [`ali-oss`](https://github.com/ali-sdk/ali-oss)). _This is highly dependent on your Aliyun OSS setup_. Check the Aliyun OSS documentation for more information.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client. You must allow CORS PUT method for the bucket to your website.

```ts
import { aliyunOssStorage } from '@payloadcms/storage-aliyun-oss'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    aliyunOssStorage({
      collections: {
        media: true,
        'media-with-prefix': {
          prefix,
        },
      },
      bucket: process.env.ALIYUN_OSS_BUCKET,
      options: {
        accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_OSS_SECRET_ACCESS_KEY,
        bucket: process.env.ALIYUN_OSS_BUCKET,
        region: process.env.ALIYUN_OSS_REGION,
        // ... Other Aliyun OSS configuration
      },
    }),
  ],
})
```

### Configuration Options

See the the [Aliyun OSS SDK Package](https://github.com/ali-sdk/ali-oss) and [`Options`](https://github.com/ali-sdk/ali-oss#ossoptions) object for guidance on Aliyun OSS configuration.
