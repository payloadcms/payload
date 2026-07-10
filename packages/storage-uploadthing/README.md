# Uploadthing Storage for Payload

> [!WARNING] > **Deprecated:** This adapter is deprecated and will be removed in Payload v5. Migrate to another storage adapter such as [`@payloadcms/storage-s3`](https://www.npmjs.com/package/@payloadcms/storage-s3) (which also works with Cloudflare R2) before upgrading. See the [storage adapters docs](https://payloadcms.com/docs/upload/storage-adapters) for available adapters.

This package provides a way to use [uploadthing](https://uploadthing.com) with Payload.

## Installation

```sh
pnpm add @payloadcms/storage-uploadthing
```

## Usage

- Configure the `collections` object to specify which collections should use uploadthing. The slug _must_ match one of your existing collection slugs and be an `upload` type.
- Get an API key from Uploadthing and set it as `apiKey` in the `options` object.
- `acl` is optional and defaults to `public-read`.
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client.

```ts
export default buildConfig({
  collections: [Media],
  plugins: [
    uploadthingStorage({
      collections: {
        media: true,
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN,
        acl: 'public-read',
      },
    }),
  ],
})
```
