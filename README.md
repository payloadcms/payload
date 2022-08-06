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

However, you can create your own adapter for any third-party service you would like to use.

## Plugin options

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option                        | Description |
| ----------------------------- | ----------- |
| **[`collections`]** *         | Array of collection-specific options to enable the plugin for. |

#### Collection-specific options

| Option                       | Description                     |
|------------------------------|---------------------------------|
| **[`slug`]** *               | The collection slug to extend.  |
| **[`disableLocalStorage`]**  | Choose to disable local storage on this collection. Defaults to `true`. |
| **[`adapter`]**              | Pass in the adapter that you'd like to use for this collection. |

#### Azure Blob Storage Adapter

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

**Important:** make sure you have all of the above environment variables filled out and that they reflect your Azure blob storage configuration.

#### Local sandbox & plugin development

This repository includes a local development environment for local testing and development of this plugin. To run the local sandbox, follow the instructions below.

1. Make sure you have Node and a MongoDB to work with
1. Clone the repo
1. `yarn` in both the root folder of the repo, and the `./dev` folder
1. `cd` into `./dev` and run `cp .env.example .env` to create an `.env` file
1. Open your newly created `./dev/.env` file and _completely_ fill out each property
1. Run `yarn dev` within the `/dev` folder
1. Open `http://localhost:3000/admin` in your browser

## Questions

Please contact [Payload](dev@payloadcms.com) with any questions about using this plugin.
