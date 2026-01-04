# Cloudinary for Payload

This package provides a simple way to use [Cloudinary](https://cloudinary.com) with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-cloudinary
```

## Usage

- Configure the `collections` object to specify which collections should use the Cloudinary adapter. The slug _must_ match one of your existing collection slugs.
- The `config` object can be any [`ConfigOptions`](https://cloudinary.com/documentation/node_integration#set_additional_configuration_parameters) object (from [`cloudinary`](https://github.com/cloudinary/cloudinary_npm)). _This is highly dependent on your Cloudinary setup_. Check the Cloudinary documentation for more information.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.

```ts
import { cloudinaryStorage } from '@payloadcms/storage-cloudinary'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    cloudinaryStorage({
      enabled: true, // Optional, defaults to true
      collections: {
        [mediaSlug]: true,
        [mediaWithPrefixSlug]: {
          prefix,
        },
      },
      folder: process.env.CLOUDINARY_FOLDER, // Optional
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      },
    }),
  ],
})
```

### Configuration Options

| Option        | Description                                                                                                                                | Default |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `enabled`     | Whether or not to enable the plugin                                                                                                        | `true`  |
| `collections` | Collections to apply the storage to                                                                                                        |         |
| `folder`      | (Optional) Folder name to upload files (if you want upload file to folder on Cloudinary)                                                   |         |
| `config`      | Cloudinary client configuration. See [Docs](https://cloudinary.com/documentation/node_integration#set_additional_configuration_parameters) |         |
