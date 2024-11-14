# Uploadthing Storage for Payload (beta)

This package provides a way to use [uploadthing](https://uploadthing.com) with Payload.

## Installation

```sh
pnpm add @payloadcms/storage-uploadthing
```

## Usage

- Configure the `collections` object to specify which collections should use uploadthing. The slug _must_ match one of your existing collection slugs and be an `upload` type.
- Get an API key from Uploadthing and set it as `apiKey` in the `options` object.
- `acl` is optional and defaults to `public-read`.

```ts
export default buildConfig({
  collections: [Media],
  plugins: [
    uploadthingStorage({
      collections: {
        [mediaSlug]: true,
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN,
        acl: 'public-read',
      },
    }),
  ],
})
```
