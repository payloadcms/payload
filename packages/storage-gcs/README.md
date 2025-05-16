# Google Cloud Storage for Payload

This package provides a simple way to use [Google Cloud Storage](https://cloud.google.com/storage) with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-gcs
```

## Usage

- Configure the `collections` object to specify which collections should use the Google Cloud Storage adapter. The slug _must_ match one of your existing collection slugs.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client. You must allow CORS PUT method for the bucket to your website.

```ts
import { gcsStorage } from '@payloadcms/storage-gcs'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    gcsStorage({
      collections: {
        media: true,
        'media-with-prefix': {
          prefix,
        },
      },
      bucket: process.env.GCS_BUCKET,
      options: {
        apiEndpoint: process.env.GCS_ENDPOINT,
        projectId: process.env.GCS_PROJECT_ID,
      },
    }),
  ],
})
```

### Configuration Options

| Option        | Description                                                                                         | Default   |
| ------------- | --------------------------------------------------------------------------------------------------- | --------- |
| `enabled`     | Whether or not to enable the plugin                                                                 | `true`    |
| `collections` | Collections to apply the storage to                                                                 |           |
| `bucket`      | The name of the bucket to use                                                                       |           |
| `options`     | Google Cloud Storage client configuration. See [Docs](https://github.com/googleapis/nodejs-storage) |           |
| `acl`         | Access control list for files that are uploaded                                                     | `Private` |
