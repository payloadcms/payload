# Cloudflare Images transformer for Payload

`@payloadcms/transformer-cloudflare` processes image uploads and serves dynamic
image transformations through Cloudflare Images. Choose a direct Workers Images
binding or an authenticated companion Worker through config. Both modes support
private source files, upload-time variants, and the same request-time parameters.
The transformer never stores images in Cloudflare Images; Payload and your storage
adapter remain responsible for persistence.

## Install

```sh
pnpm add @payloadcms/transformer-cloudflare
```

## Payload running on Cloudflare Workers

Add an Images binding to your application's Wrangler configuration:

```jsonc
{
  "images": { "binding": "IMAGES" },
}
```

Pass the binding when creating the Payload config. If your framework exposes
bindings only inside a request, use the lazy resolver instead. It receives the
Payload request and is called only when image processing actually runs.

```ts
import { cloudflareTransformer } from '@payloadcms/transformer-cloudflare'
import { buildConfig } from 'payload'

export default buildConfig({
  collections: [
    /* your upload collections */
  ],
  upload: {
    transformers: [
      cloudflareTransformer({
        transport: { mode: 'binding', binding: env.IMAGES },
        dynamic: true,
      }),
    ],
  },
})

// A framework-specific runtime context can also be resolved lazily:
cloudflareTransformer({
  transport: {
    mode: 'binding',
    binding: async ({ req }) => getRuntimeBindings({ req }).IMAGES,
  },
  dynamic: true,
})
```

`env` and `getRuntimeBindings` above represent your framework's environment access;
the package does not import a Next.js, OpenNext, or TanStack runtime.

## Payload running on Node or Vercel

Cloudflare's URL transformations fetch source URLs. To process private or newly
uploaded bytes from outside Workers, deploy this package's companion handler in a
small Worker with an Images binding, then configure its URL and shared secret.
Remote mode sends the bytes to that Worker; it does not call a stateless byte
transformation endpoint on `api.cloudflare.com`.

Worker source (`src/index.ts`):

```ts
import type { CloudflareImagesBinding } from '@payloadcms/transformer-cloudflare'

import { createCloudflareImagesHandler } from '@payloadcms/transformer-cloudflare/worker'

type Env = {
  IMAGES: CloudflareImagesBinding
  TRANSFORMER_TOKEN: string
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return createCloudflareImagesHandler({
      binding: env.IMAGES,
      token: env.TRANSFORMER_TOKEN,
    })(request)
  },
}
```

Worker Wrangler configuration:

```jsonc
{
  "name": "payload-image-transformer",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-07",
  "images": { "binding": "IMAGES" },
}
```

Install this package in the Worker project, set a strong shared secret with
`pnpm exec wrangler secret put TRANSFORMER_TOKEN`, and deploy the Worker. Set the
same secret in Payload's server environment. Keep it out of browser bundles.
The `./worker` entry has no runtime dependency on Payload or Sharp.

Payload configuration:

```ts
cloudflareTransformer({
  transport: {
    mode: 'remote',
    url: process.env.CLOUDFLARE_TRANSFORMER_URL!,
    token: process.env.CLOUDFLARE_TRANSFORMER_TOKEN!,
    timeout: 30_000, // default, per call
  },
  dynamic: true,
})
```

The remote endpoint requires HTTPS, authenticates before reading the request body,
and accepts only bounded image uploads and the supported transformation options.
The client refuses redirects and validates response types. A custom `transport.fetch`
can be supplied for an alternative HTTP client or a Worker service binding.

## Dynamic transformation

Dynamic transformations are disabled by default. Enable them for every upload
collection with `dynamic: true`, or restrict them:

```ts
cloudflareTransformer({
  transport: { mode: 'binding', binding: env.IMAGES },
  dynamic: {
    collections: ['media'],
    fit: 'cover',
    gravity: 'auto',
    format: 'webp',
    quality: 80,
    anim: true,
    maxWidth: 4096,
    maxHeight: 4096,
    maxPixels: 16_777_216,
    withoutEnlargement: false,
  },
})
```

```text
/api/media/file/photo.png?width=400
/api/media/file/photo.png?width=400&height=300
/api/media/file/photo.png?width=400&withoutEnlargement=true
```

These are the same parameters Sharp and Cloudinary recognize. Cloudflare-specific
options come from server config, not unrestricted query parameters. Invalid,
duplicate, or excessive resize parameters return `400` before source retrieval.
Single-dimension requests also check the dimension implied by the source aspect
ratio. Range requests return `416`; HEAD returns transformed headers without a body.

By default, two dimensions use `cover`, and one dimension preserves the aspect
ratio. `withoutEnlargement` maps `cover` to `crop` and `contain` to `scale-down`.
Explicit `crop` and `scale-down` never upscale. When `dynamic.format` is omitted,
the source format is retained. `format` accepts `jpeg`, `png`, `gif`, `webp`, and
`avif`; `quality` accepts integers from 1 to 100. Animation is retained where the
output format supports it unless `anim: false` is configured. `maxPixels` bounds
pixels per frame; it does not count animation frames.

Source retrieval uses Payload's lazy `getSourceFile()` after validation and access
checks, so private originals need no public URL. Each successful transform returns
`continue`, allowing another eligible transformer to consume the result. Responses
use `Cache-Control: private, no-store` to keep protected files out of shared caches.
This package does not automatically cache derivatives.

## Upload-time processing

Configure upload processing per collection on the transformer, as with Sharp and
Cloudinary:

```ts
cloudflareTransformer({
  transport: { mode: 'remote', url: 'https://images.example.com', token: secret },
  collections: {
    media: {
      crop: true,
      focalPoint: true,
      resizeOptions: { width: 2048, withoutEnlargement: true },
      formatOptions: { format: 'webp', quality: 80 },
      variants: [
        { name: 'thumbnail', width: 400, height: 300 },
        { name: 'card', width: 768, height: 1024, gravity: 'auto' },
        { name: 'small', width: 200, withoutEnlargement: true },
      ],
    },
  },
})
```

The main file runs through the pipeline once. Variants derive from that main file,
including the selected Admin crop and any main resize. Metadata is read from the
actual output files, and variants are persisted under `variants.<name>`. Variants
can override format and quality with their own `formatOptions`. Custom
`generateImageName` callbacks receive the actual dimensions and output extension.
Variant names must contain only letters, digits, underscores, or hyphens, and must
be unique and not collide with built-in upload fields.

The default fit is `cover` when both dimensions are provided and `contain` when
only one is provided. An undersized source omits a variant by default: both source
dimensions must be smaller for a two-dimension variant, or the specified axis must
be smaller for a single-dimension variant. `withoutEnlargement: false` permits
upscaling; `true` produces a smaller result instead of omitting it.

Admin focal points map to Cloudflare's `box-center` gravity. An explicit variant
`gravity` takes precedence. `crop` and `focalPoint` use the existing Admin controls;
startup publishes their configuration and variant names to Payload without
mutating authored collections. A collection can have upload settings on only one
transformer instance; different collections can use different providers.

`resizeOptions` additionally supports `background`, `blur`, `brightness`,
`contrast`, `flip`, `gamma`, `rotate`, `saturation`, `sharpen`, and pixel `trim`
rectangles. The fit modes supported by this package are `cover`, `contain`, `crop`,
and `scale-down`. Other Cloudflare features such as overlays and AI segmentation
are outside this package's configuration surface.

## Limits and development

- Supported inputs: JPEG, PNG, GIF, WebP, and AVIF. SVG and TIFF are not routed.
- Each input and transformed output is limited to 20 MiB. Both modes buffer output
  bytes to validate response size; remote mode also buffers the multipart request.
- Remote mode makes a separate metadata or transformation call as needed. Metadata
  probing is free in the Images binding, but still incurs network latency remotely.
- Binding calls are not automatically cached. Cloudflare bills transformations
  according to its Images subscription and usage rules.
- The local Wrangler Images emulator supports a subset of production features.
  Exercise crop, focal point, gravity, and animation against the remote binding
  before production use.

See [Cloudflare's Images binding documentation](https://developers.cloudflare.com/images/optimization/binding/)
and [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/).

### Accessibility verification

This package uses existing Admin crop/focal-point controls and does not introduce
markup, labels, focus handling, or keyboard behavior. WCAG 2.2 A/AA criteria
assessed for potential effects are 1.1.1 (image alternatives), 1.3.1 (relationships),
2.1.1 (keyboard), 2.4.3 (focus order), 2.4.7 (visible focus), 2.4.11 (focus not
obscured), and 4.1.2 (name, role, value). Unit tests cover configuration projection,
crop coordinates, focal-point translation, and output metadata; they are not
browser or WCAG conformance evidence. Before release, manually verify crop and
focal-point selection, keyboard and focus behavior, and meaningful image content
with the production Admin and a live Cloudflare binding. No screen-reader or axe
run has been performed for this package.
