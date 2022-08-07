# Payload Cloud Storage Plugin

This repository contains the officially supported Payload Cloud Storage plugin. It extends Payload to allow you to store all uploaded media in third-party permanent storage.

#### Requirements

- Payload version `1.0.16` or higher is required

## Usage

Install this plugin within your Payload as follows:

```ts
import { buildConfig } from 'payload/config';
import path from 'path';
import { cloudStorage } from '@payloadcms/plugin-cloud-storage';

export default buildConfig({
  plugins: [
    cloudStorage({
      collections: [{
        slug: 'my-collection-slug',
        adapter: theAdapterToUse, // see docs for the adapter you want to use
      }]
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
| `collections` *         | Array of collection-specific options to enable the plugin for. |

**Collection-specific options:**

| Option                       | Description                     |
|------------------------------|---------------------------------|
| `slug` *               | The collection slug to extend.  |
| `adapter` *            | Pass in the adapter that you'd like to use for this collection. |
| `disableLocalStorage`  | Choose to disable local storage on this collection. Defaults to `true`. |

### Azure Blob Storage Adapter

To use the Azure Blob Storage adapter, you need to have `@azure/storage-blob` installed in your project dependencies. To do so, run `yarn add @azure/storage-blob`.

From there, create the adapter, passing in all of its required properties:

```js
import { azureBlobStorageAdapter } from '@payloadcms/plugin-cloud-storage';

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
import { s3Adapter } from '@payloadcms/plugin-cloud-storage';

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

## Local development

For instructions regarding how to develop with this plugin locally, [click here]([/docs/local-dev.md](https://github.com/payloadcms/plugin-cloud-storage/blob/master/docs/local-dev.md)).

## Questions

Please contact [Payload](dev@payloadcms.com) with any questions about using this plugin.

## Credit

This plugin was created with significant help, and code, from [Alex Bechmann](https://github.com/alexbechmann) and [Richard VanBergen](https://github.com/richardvanbergen). Thank you!!
