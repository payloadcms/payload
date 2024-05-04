# Netlify Blobs Storage for Payload

This package provides a simple way to use [Netlify Blobs](https://docs.netlify.com/blobs/overview/) storage with Payload.

## Installation

```sh
pnpm add @payloadcms/storage-netlify-blobs
```

## Usage

- Configure the `collections` object to specify which collections should use the Netlify Blobs adapter. The slug _must_ match one of your existing collection slugs.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.

```ts
import { netlifyBlobStorage } from '@payloadcms/storage-netlify-blobs'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    netlifyBlobStorage({
      enabled: true, // Optional, defaults to true
      // Specify which collections should use Netlify Blobs
      collections: {
        [Media.slug]: true,
        [MediaWithPrefix.slug]: {
          prefix: 'my-prefix',
        },
      },
    }),
  ],
})
```

| Option        | Description                                           | Default   |
| ------------- | ----------------------------------------------------- | --------- |
| `enabled`     | Whether or not to enable the plugin                   | `true`    |
| `collections` | Collections that should use the Netlify Blobs adapter |           |
| `storeName`   | The blob store name to use for Payload                | `payload` |

## Local development

When running locally you must use the [Netlify CLI](https://docs.netlify.com/cli/get-started/) to run your site. This ensures that the mock server is running and that the Netlify Blobs adapter can communicate with it.

```sh
pnpm install -g netlify-cli

netlify link
netlify dev
```
