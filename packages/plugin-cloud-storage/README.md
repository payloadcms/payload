# Payload Cloud Storage Plugin

This repository contains the officially supported Payload Cloud Storage plugin. It extends Payload to allow you to store all uploaded media in third-party permanent storage.

#### Requirements

- Payload version `1.0.19` or higher is required

## Installation

`yarn add @payloadcms/plugin-cloud-storage` or `npm install @payloadcms/plugin-cloud-storage`

## Usage

Add this package into your dependencies executing this code in your command line:

`yarn add @payloadcms/plugin-cloud-storage`

Now install this plugin within your Payload as follows:

```ts
import { buildConfig } from 'payload/config'
import path from 'path'
import { cloudStorage } from '@payloadcms/plugin-cloud-storage'

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
})
```

### Conditionally Enabling/Disabling

The proper way to conditionally enable/disable this plugin is to use the `enabled` property.

```ts
cloudStorage({
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

### Azure Blob Storage Adapter

To use the Azure Blob Storage adapter, you need to have `@azure/storage-blob` installed in your project dependencies. To do so, run `yarn add @azure/storage-blob`.

From there, create the adapter, passing in all of its required properties:

```js
import { azureBlobStorageAdapter } from '@payloadcms/plugin-cloud-storage/azure'

// if you need to obtain credentials you may do so by following the instructions here: https://docs.microsoft.com/en-us/azure/storage/common/storage-auth-aad-app?tabs=javascript
// or you can use the connection string directly.

const adapter = azureBlobStorageAdapter({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
  allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
  baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
  /**
   * Optional: You may wish to obtain credentials that cannot be passed through in the connectionString connection option. In that case the connectionString will only be the URL to the storage account.
   * Can be one of AnonymousCredential | StorageSharedKeyCredential | TokenCredential
   **/
  credentials: new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.AZURE_STORAGE_ACCOUNT_KEY),
})

// Now you can pass this adapter to the plugin
```

### S3 Adapter

To use the S3 adapter, some peer dependencies need to be installed:

`yarn add @aws-sdk/client-s3 @aws-sdk/lib-storage aws-crt`.

From there, create the adapter, passing in all of its required properties:

```js
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'

const adapter = s3Adapter({
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    region: process.env.S3_REGION,
    // ... Other S3 configuration
  },
  bucket: process.env.S3_BUCKET,
})

// Now you can pass this adapter to the plugin
```

Note that the credentials option does not have to be used when you are using PayloadCMS on an EC2 instance that has been configured with an IAM Role with necessary permissions.

Other S3 Client configuration is documented [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientconfig.html).

Any upload over 50MB will automatically be uploaded using S3's multi-part upload.

#### Other S3-Compatible Storage

If you're running an S3-compatible object storage such as MinIO or Digital Ocean Spaces, you'll have to set the `endpoint` appropriately for the provider.

```js
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'

const adapter = s3Adapter({
  config: {
    endpoint: process.env.S3_ENDPOINT, // Configure for your provider
    // ...
  },
  // ...
})
```

### GCS Adapter

To use the GCS adapter, you need to have `@google-cloud/storage` installed in your project dependencies. To do so, run `yarn add @google-cloud/storage`.

From there, create the adapter, passing in all of its required properties:

```js
import { gcsAdapter } from '@payloadcms/plugin-cloud-storage/gcs'

const adapter = gcsAdapter({
  options: {
    // you can choose any method for authentication, and authorization which is being provided by `@google-cloud/storage`
    keyFilename: './gcs-credentials.json',
    //OR
    credentials: JSON.parse(process.env.GCS_CREDENTIALS || '{}'), // this env variable will have stringify version of your credentials.json file
  },
  bucket: process.env.GCS_BUCKET,
})

// Now you can pass this adapter to the plugin
```

### Payload Access Control

Payload ships with access control that runs _even on statically served files_. The same `read` access control property on your `upload`-enabled collections is used, and it allows you to restrict who can request your uploaded files.

To preserve this feature, by default, this plugin _keeps all file URLs exactly the same_. Your file URLs won't be updated to point directly to your cloud storage source, as in that case, Payload's access control will be completely bypassed and you would need public readability on your cloud-hosted files.

Instead, all uploads will still be reached from the default `/collectionSlug/staticURL/filename` path. This plugin will "pass through" all files that are hosted on your third-party cloud service—with the added benefit of keeping your existing access control in place.

If this does not apply to you (your upload collection has `read: () => true` or similar) you can disable this functionality by setting `disablePayloadAccessControl` to `true`. When this setting is in place, this plugin will update your file URLs to point directly to your cloud host.

## Local development

For instructions regarding how to develop with this plugin locally, [click here](https://github.com/payloadcms/payload/blob/main/packages/plugin-cloud-storage/docs/local-dev.md).

## Questions

Please contact [Payload](mailto:dev@payloadcms.com) with any questions about using this plugin.

## Credit

This plugin was created with significant help, and code, from [Alex Bechmann](https://github.com/alexbechmann) and [Richard VanBergen](https://github.com/richardvanbergen). Thank you!!
