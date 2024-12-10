# Payload Cloud Storage Plugin

This repository contains the officially supported Payload Cloud Storage plugin. It extends Payload to allow you to store all uploaded media in third-party permanent storage.

**NOTE:** If you are using Payload 3.0 and one of the following storage services, you should use one of following packages instead of this one:

| Service              | Package                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Vercel Blob          | [`@payloadcms/storage-vercel-blob`](https://github.com/payloadcms/payload/tree/main/packages/storage-vercel-blob) |
| AWS S3               | [`@payloadcms/storage-s3`](https://github.com/payloadcms/payload/tree/main/packages/storage-s3)                   |
| Azure                | [`@payloadcms/storage-azure`](https://github.com/payloadcms/payload/tree/main/packages/storage-azure)             |
| Google Cloud Storage | [`@payloadcms/storage-gcs`](https://github.com/payloadcms/payload/tree/main/packages/storage-gcs)                 |

This package is now best used for implementing custom storage solutions or third-party storage services that do not have `@payloadcms/storage-*` packages.

## Installation

`pnpm add @payloadcms/plugin-cloud-storage`

## Usage

```ts
import { buildConfig } from 'payload'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

export default buildConfig({
  plugins: [
    cloudStoragePlugin({
      collections: {
        'my-collection-slug': {
          adapter: theAdapterToUse, // see docs for the adapter you want to use
        },
      },
    }),
  ],
  // The rest of your config goes here
})
```

### Conditionally Enabling/Disabling

The proper way to conditionally enable/disable this plugin is to use the `enabled` property.

```ts
cloudStoragePlugin({
  enabled: process.env.MY_CONDITION === 'true',
  collections: {
    'my-collection-slug': {
      adapter: theAdapterToUse, // see docs for the adapter you want to use
    },
  },
}),
```

If the code is included _in any way in your config_ but conditionally disabled in another fashion, you may run into issues such as `Webpack Build Error: Can't Resolve 'fs' and 'stream'` or similar because the plugin must be run at all times in order to properly extend the webpack config.

## Features

**Adapter-based Implementation**

This plugin supports the following adapters:

- [Azure Blob Storage](#azure-blob-storage-adapter)
- [AWS S3-style Storage](#s3-adapter)
- [Google Cloud Storage](#gcs-adapter)
- [Vercel Blob Storage](#vercel-blob-adapter)

However, you can create your own adapter for any third-party service you would like to use.

All adapters are implemented `dev` directory's [Payload Config](https://github.com/payloadcms/plugin-cloud-storage/blob/master/dev/src/payload.config.ts). See this file for examples.

## Plugin options

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option           | Type                                                                                                                                                   | Description                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `collections` \* | Record<string, [CollectionOptions](https://github.com/payloadcms/plugin-cloud-storage/blob/c4a492a62abc2f21b4cd6a7c97778acd8e831212/src/types.ts#L48)> | Object with keys set to the slug of collections you want to enable the plugin for, and values set to collection-specific options. |
| `enabled`        |                                                                                                                                                        | `boolean` to conditionally enable/disable plugin. Default: true.                                                                  |

**Collection-specific options:**

| Option                        | Type                                                                                               | Description                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adapter` \*                  | [Adapter](https://github.com/payloadcms/plugin-cloud-storage/blob/master/src/types.ts#L51)         | Pass in the adapter that you'd like to use for this collection. You can also set this field to `null` for local development if you'd like to bypass cloud storage in certain scenarios and use local storage. |
| `disableLocalStorage`         | `boolean`                                                                                          | Choose to disable local storage on this collection. Defaults to `true`.                                                                                                                                       |
| `disablePayloadAccessControl` | `true`                                                                                             | Set to `true` to disable Payload's access control. [More](#payload-access-control)                                                                                                                            |
| `prefix`                      | `string`                                                                                           | Set to `media/images` to upload files inside `media/images` folder in the bucket.                                                                                                                             |
| `generateFileURL`             | [GenerateFileURL](https://github.com/payloadcms/plugin-cloud-storage/blob/master/src/types.ts#L53) | Override the generated file URL with one that you create.                                                                                                                                                     |

### Payload Access Control

Payload ships with access control that runs _even on statically served files_. The same `read` access control property on your `upload`-enabled collections is used, and it allows you to restrict who can request your uploaded files.

To preserve this feature, by default, this plugin _keeps all file URLs exactly the same_. Your file URLs won't be updated to point directly to your cloud storage source, as in that case, Payload's access control will be completely bypassed and you would need public readability on your cloud-hosted files.

Instead, all uploads will still be reached from the default `/:collectionSlug/file/:filename` path. This plugin will "pass through" all files that are hosted on your third-party cloud service—with the added benefit of keeping your existing access control in place.

If this does not apply to you (your upload collection has `read: () => true` or similar) you can disable this functionality by setting `disablePayloadAccessControl` to `true`. When this setting is in place, this plugin will update your file URLs to point directly to your cloud host.

## Credit

This plugin was created with significant help, and code, from [Alex Bechmann](https://github.com/alexbechmann) and [Richard VanBergen](https://github.com/richardvanbergen). Thank you!!
