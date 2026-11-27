# Vercel Blob Storage for Payload

This package provides a simple way to use [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) storage with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-vercel-blob
```

## Usage

- Configure the `collections` object to specify which collections should use the Vercel Blob adapter. The slug _must_ match one of your existing collection slugs.
- Authenticate with either a read/write token or [OIDC](#authentication) (see below).
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
| `token`              | Vercel Blob storage read/write token (omit to use OIDC)              | `undefined`                   |
| `storeId`            | Vercel Blob store ID, for OIDC auth (see below)                      | `process.env.BLOB_STORE_ID`   |
| `clientUploads`      | Do uploads directly on the client to bypass limits on Vercel         |                               |

## Authentication

The adapter supports two authentication methods.

### Read/write token

Pass a long-lived `BLOB_READ_WRITE_TOKEN` as `token`. This is usually set by
Vercel automatically after adding blob storage to your project:

```ts
vercelBlobStorage({
  collections: { media: true },
  token: process.env.BLOB_READ_WRITE_TOKEN,
})
```

### OIDC

[Vercel Blob now supports OIDC authentication](https://vercel.com/changelog/vercel-blob-now-supports-oidc-authentication),
which is the default for newly connected projects. Vercel issues short-lived,
auto-rotating tokens, so you no longer need a long-lived `BLOB_READ_WRITE_TOKEN`.

To use OIDC, **omit `token`**. The adapter then lets `@vercel/blob` resolve
credentials from the environment (`VERCEL_OIDC_TOKEN`), and identifies the store
with `storeId` / the `BLOB_STORE_ID` environment variable. When running on
Vercel with a connected store, `BLOB_STORE_ID` is set for you automatically:

```ts
vercelBlobStorage({
  collections: { media: true },
  // No `token` — OIDC credentials and BLOB_STORE_ID come from the environment.
})
```

Provide `storeId` explicitly when `BLOB_STORE_ID` is not available (for example,
a team-level store, or code running outside Vercel):

```ts
vercelBlobStorage({
  collections: { media: true },
  storeId: process.env.MY_BLOB_STORE_ID,
})
```

> **Note:** `clientUploads` is not supported in OIDC-only mode. Client uploads
> mint short-lived client tokens server-side, which requires a read/write
> `token`. Without a `token`, `clientUploads` is ignored.

If neither a `token` nor a resolvable store ID (`storeId` or `BLOB_STORE_ID`) is
available, the plugin disables itself and falls back to local storage, as
before.

OIDC credentials are only available on Vercel, or locally after
`vercel env pull`. If `storeId` or `BLOB_STORE_ID` is set but no credentials are
available, uploads fail instead of falling back to local storage. Set
`enabled: false` where you want local storage.
