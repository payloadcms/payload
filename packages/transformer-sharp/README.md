# Sharp Transformer for Payload

Payload's official [file transformer](https://payloadcms.com/docs/upload/transformers) for Sharp-based image processing: upload-time resizing/format conversion (the same behavior Payload has always provided) plus request-time dynamic resizing.

## Installation

```sh
pnpm add @payloadcms/transformer-sharp
```

## Usage

Register `sharpTransformer()` under `upload.transformers` in your Payload Config:

```ts
import { buildConfig } from 'payload'
import { sharpTransformer } from '@payloadcms/transformer-sharp'

export default buildConfig({
  upload: {
    transformers: [sharpTransformer()],
  },
})
```

### Upload-time image processing

Configure per-collection Sharp settings through `sharpTransformer({ collections })`:

```ts
sharpTransformer({
  collections: {
    media: {
      imageSizes: [
        { name: 'thumbnail', width: 400, height: 300 },
        { name: 'card', width: 768, height: 1024 },
      ],
      resizeOptions: { width: 2048, height: 2048, withoutEnlargement: true },
      formatOptions: { format: 'webp' },
      trimOptions: undefined,
      constructorOptions: undefined,
      withMetadata: false,
      crop: true,
      focalPoint: true,
    },
  },
})
```

`imageSizes`, `crop`, and `focalPoint` are also written back onto the collection's own sanitized `upload` config at startup (name/`admin`/`generateImageName` only, for `imageSizes`), so the Admin Panel, generated types, and the `sizes` shape on your documents behave exactly as before.

### Dynamic (request-time) resizing

Once registered for a collection, requesting a stored image with recognized query parameters resizes it on the fly, without storing the result:

```
GET /api/media/file/photo.png?width=400
GET /api/media/file/photo.png?width=400&height=300
GET /api/media/file/photo.png?width=400&withoutEnlargement=true
```

Configure defaults for these requests:

```ts
sharpTransformer({
  dynamic: {
    fit: 'cover', // default
    position: 'center', // default
    maxWidth: 4096, // default
    maxHeight: 4096, // default
    maxPixels: 16_777_216, // default
    withoutEnlargement: false, // default
  },
})
```

### Injecting a custom Sharp build

```ts
import customSharp from 'sharp'

sharpTransformer({ sharp: customSharp })
```

See the [File Transformers](https://payloadcms.com/docs/upload/transformers) docs for the full transformer contract, access-control lifecycle, and non-goals (no caching, no CDN integration, no jobs queue).

## Migrating from Payload 3.x

If you previously configured `sharp`/`resizeOptions`/`imageSizes`/etc. directly on your Payload Config or collections, run:

```sh
npx @payloadcms/codemod --transform migrate-sharp-to-transformer
```

See the [v4 migration guide](https://payloadcms.com/docs/migration-guide/v4#sharp-moved-out-of-core-into-payloadcmstransformer-sharp) for details.
