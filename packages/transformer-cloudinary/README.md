# Cloudinary transformer for Payload

A Cloudinary-backed [file transformer](https://payloadcms.com/docs/upload/transformers) for Payload: request-time image transformation delivered from Cloudinary's CDN, plus upload-time image processing.

Use this instead of (or alongside) `@payloadcms/transformer-sharp` when you want Cloudinary's content-aware features — `g_auto` smart cropping, `f_auto` format negotiation, `q_auto` quality — rather than local Sharp processing.

## Installation

```sh
pnpm add @payloadcms/transformer-cloudinary
```

## Usage

```ts
import { cloudinaryTransformer } from '@payloadcms/transformer-cloudinary'
import { buildConfig } from 'payload'

export default buildConfig({
  serverURL: 'https://example.com',
  upload: {
    transformers: [cloudinaryTransformer()],
  },
})
```

Credentials are read from `CLOUDINARY_URL` (`cloudinary://<api_key>:<api_secret>@<cloud_name>`) by default. Pass `url` or `config` to override. They are resolved eagerly, so a misconfigured cloud fails at startup rather than on the first upload.

## Dynamic (request-time) transformation

Requesting a file with recognized query parameters transforms it on the fly, without storing the result:

```
GET /api/media/file/photo.png?width=400
GET /api/media/file/photo.png?height=300
GET /api/media/file/photo.png?width=400&height=300
GET /api/media/file/photo.png?width=400&withoutEnlargement=true
```

These are deliberately the same parameters `@payloadcms/transformer-sharp` recognizes — both share one file endpoint, so a URL should not mean different things depending on which transformer is installed. Cloudinary-specific settings (crop mode, gravity, format, quality) are configured on the transformer rather than per request.

Sharp's resize semantics map onto Cloudinary crop modes like this:

| Request                              | Cloudinary crop mode |
| ------------------------------------ | -------------------- |
| `width` + `height`                   | `c_fill`             |
| `width` or `height`                  | `c_scale`            |
| `width` + `height` + no enlargement  | `c_lfill`            |
| `width` or `height` + no enlargement | `c_limit`            |

### How the source reaches Cloudinary

This transformer uses Cloudinary's [fetch delivery](https://cloudinary.com/documentation/fetch_remote_images): it builds an `image/fetch/` URL over the stored file's own URL and lets Cloudinary pull the source itself. `getSourceFile` is never called, so the stored bytes never pass through Payload — and the single-use source handle stays available to any later transformer in the pipeline.

That means the source URL **must be reachable from the public internet**, and its host must be allow-listed in your Cloudinary fetch settings. A `localhost` dev server will not work; use a tunnel or point `sourceURL` at your storage adapter's CDN URL.

By default the source URL is the requested file's own `url`, resolved against your config's `serverURL`. Override it when the default is not publicly reachable:

```ts
cloudinaryTransformer({
  sourceURL: ({ filename }) => `https://cdn.example.com/media/${filename}`,
})
```

### Delivery mode

```ts
cloudinaryTransformer({ delivery: 'proxy' }) // default
```

- `'proxy'` (default): Payload streams the bytes back from Cloudinary. Neither the Cloudinary URL nor the underlying source URL is exposed, and the response stays behind the collection's access control.
- `'redirect'`: Payload answers `302` with the Cloudinary URL. Cheapest — no bytes pass through Payload — but the transformed variant becomes publicly reachable and the source URL is disclosed to the client.

### Dynamic defaults

```ts
cloudinaryTransformer({
  dynamic: {
    crop: 'fill', // default, when both width and height are given
    gravity: 'center', // default — try 'auto' for content-aware cropping
    quality: 'auto', // default
    format: undefined, // default (keep the source format); 'auto' negotiates per browser
    maxWidth: 4096, // default
    maxHeight: 4096, // default
    maxPixels: 16_777_216, // default
    withoutEnlargement: false, // default
  },
})
```

## Upload-time image processing

Per-collection settings are authored through `cloudinaryTransformer({ collections })`, not on the collection's own `upload` config:

```ts
cloudinaryTransformer({
  collections: {
    media: {
      crop: true,
      focalPoint: true,
      imageSizes: [
        { name: 'thumbnail', height: 300, width: 400 },
        // Cloudinary's content-aware crop — no local equivalent in Sharp
        { name: 'card', gravity: 'auto', height: 1024, width: 768 },
      ],
      resizeOptions: { width: 2048 },
      formatOptions: { format: 'webp', quality: 'auto' },
    },
  },
})
```

At startup this writes a Cloudinary-agnostic projection of `imageSizes`, `crop`, and `focalPoint` back onto the collection's sanitized `upload` config, so the Admin Panel, generated types, and the rest of core keep seeing `collection.upload.imageSizes` exactly as before. The `sizes` shape on your documents is unchanged, including the long-standing behavior where a size larger than the source in both dimensions is recorded with null metadata.

<!-- prettier-ignore -->
> **Note on cost and latency.** Cloudinary has no stateless "transform these bytes" API — every transformation is addressed against a stored asset. Upload-time processing therefore stages the original as a short-lived Cloudinary asset, generates all derived sizes in one call, pulls them back, and deletes the staged original before returning. That is one upload, one derivation call, and one delete per uploaded file, on top of fetching each derived size. If you only need local resizing, `@payloadcms/transformer-sharp` does it without the round trip.

Staged originals are written to `payload-transformer-tmp/` (configurable via `uploadFolder`). They are removed once the upload completes; a hard process crash mid-upload can leave one behind, so consider an auto-delete rule on that folder.

## Options

| Option         | Description                                                 | Default                      |
| -------------- | ----------------------------------------------------------- | ---------------------------- |
| `collections`  | Per-collection upload-time image processing settings        |                              |
| `config`       | Cloudinary client configuration                             |                              |
| `delivery`     | `'proxy'` or `'redirect'`                                   | `'proxy'`                    |
| `dynamic`      | Defaults for request-time transformation                    |                              |
| `slug`         | Transformer slug, unique across `upload.transformers`       | `'cloudinary'`               |
| `sourceURL`    | Overrides how the publicly reachable source URL is resolved | the file's `url`             |
| `uploadFolder` | Folder for short-lived upload-time originals                | `'payload-transformer-tmp'`  |
| `url`          | `cloudinary://<api_key>:<api_secret>@<cloud_name>`          | `process.env.CLOUDINARY_URL` |
