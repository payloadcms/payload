# Payload Cloud Storage Plugin

This repository contains the officially supported Payload Cloud Storage plugin. It extends Payload to allow you to store all uploaded media in third-party permanent storage.

#### Requirements

- Payload version `1.0.19` or higher is required

## Usage

Install this plugin within your Payload as follows:

```ts
import { buildConfig } from 'payload/config';
import path from 'path';
import { cloudStorage } from '@payloadcms/plugin-cloud-storage';

export default buildConfig({
  plugins: [
    cloudStorage({
      collections: {
        'my-collection-slug': {
          adapter: theAdapterToUse, // see docs for the adapter you want to use
        },
      },
    }),
  ],
  // The rest of your config goes here
});
```

## Features

**Adapter-based Implementation**

This plugin supports the following adapters:

- [Azure Blob Storage](#azure-blob-storage-adapter)
- [AWS S3-style Storage](#s3-adapter)

However, you can create your own adapter for any third-party service you would like to use.

## Plugin options

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option                  | Description |
| ----------------------- | ----------- |
| `collections` *         | Object with keys set to the slug of collections you want to enable the plugin for, and values set to collection-specific options. |

**Collection-specific options:**

| Option                       | Description                     |
|------------------------------|---------------------------------|
| `adapter` *            | Pass in the adapter that you'd like to use for this collection. |
| `disableLocalStorage`  | Choose to disable local storage on this collection. Defaults to `true`. |
| `disablePayloadAccessControl` | Set to `true` to disable Payload's access control. [More](#payload-access-control) |

### Azure Blob Storage Adapter

To use the Azure Blob Storage adapter, you need to have `@azure/storage-blob` installed in your project dependencies. To do so, run `yarn add @azure/storage-blob`.

From there, create the adapter, passing in all of its required properties:

```js
import { azureBlobStorageAdapter } from '@payloadcms/plugin-cloud-storage/azure';

const adapter = azureBlobStorageAdapter({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
  allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
  baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
})

// Now you can pass this adapter to the plugin
```

### S3 Adapter

To use the S3 adapter, you need to have `@aws-sdk/client-s3` installed in your project dependencies. To do so, run `yarn add @aws-sdk/client-s3`.

From there, create the adapter, passing in all of its required properties:

```js
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3';

const adapter = s3Adapter({
  config: {
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }
  },
  bucket: process.env.S3_BUCKET,
})

// Now you can pass this adapter to the plugin
```

### Payload Access Control

Payload ships with access control that runs _even on statically served files_. The same `read` access control property on your `upload`-enabled collections is used, and it allows you to restrict who can request your uploaded files.

To preserve this feature, by default, this plugin _keeps all file URLs exactly the same_. Your file URLs won't be updated to point directly to your cloud storage source, as in that case, Payload's access control will be completely bypassed and you would need public readability on your cloud-hosted files.

Instead, all uploads will still be reached from the default `/collectionSlug/staticURL/filename` path. This plugin will "pass through" all files that are hosted on your third-party cloud service—with the added benefit of keeping your existing access control in place.

If this does not apply to you (your upload collection has `read: () => true` or similar) you can disable this functionality by setting `disablePayloadAccessControl` to `true`. When this setting is in place, this plugin will update your file URLs to point directly to your cloud host.

## Local development

For instructions regarding how to develop with this plugin locally, [click here](https://github.com/payloadcms/plugin-cloud-storage/blob/master/docs/local-dev.md).

## Questions

Please contact [Payload](dev@payloadcms.com) with any questions about using this plugin.

## Credit

This plugin was created with significant help, and code, from [Alex Bechmann](https://github.com/alexbechmann) and [Richard VanBergen](https://github.com/richardvanbergen). Thank you!!
