# Vercel Blob Storage for Payload

This package provides a simple way to use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) storage with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-vercel-blob
```

## Usage

- Configure the `collections` object to specify which collections should use the Vercel Blob adapter. The slug _must_ match one of your existing collection slugs.
- Ensure you have `BLOB_READ_WRITE_TOKEN` set in your Vercel environment variables. This is usually set by Vercel automatically after adding blob storage to your project.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client.

```ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    vercelBlobStorage({
      enabled: true, // Optional, defaults to true
      // Specify which collections should use Vercel Blob
      collections: {
        media: true,
        'media-with-prefix': {
          prefix: 'my-prefix',
        },
      },
      // Token provided by Vercel once Blob storage is added to your Vercel project
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
```

| Option               | Description                                                          | Default                       |
| -------------------- | -------------------------------------------------------------------- | ----------------------------- |
| `enabled`            | Whether or not to enable the plugin                                  | `true`                        |
| `collections`        | Collections to apply the Vercel Blob adapter to                      |                               |
| `addRandomSuffix`    | Add a random suffix to the uploaded file name in Vercel Blob storage | `false`                       |
| `cacheControlMaxAge` | Cache-Control max-age in seconds                                     | `365 * 24 * 60 * 60` (1 Year) |
| `token`              | Vercel Blob storage read/write token                                 | `''`                          |
| `clientUploads`      | Do uploads directly on the client to bypass limits on Vercel         |                               |
