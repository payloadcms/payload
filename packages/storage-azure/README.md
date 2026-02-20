# Azure Blob Storage for Payload

This package provides a simple way to use [Azure Blob Storage](https://azure.microsoft.com/en-us/products/storage/blobs) with Payload.

**NOTE:** This package removes the need to use `@payloadcms/plugin-cloud-storage` as was needed in Payload 2.x.

## Installation

```sh
pnpm add @payloadcms/storage-azure
```

## Usage

- Configure the `collections` object to specify which collections should use the Azure Blob Storage adapter. The slug _must_ match one of your existing collection slugs.
- When enabled, this package will automatically set `disableLocalStorage` to `true` for each collection.
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client. You must allow CORS PUT method to your website.

```ts
import { azureStorage } from '@payloadcms/storage-azure'
import { Media } from './collections/Media'
import { MediaWithPrefix } from './collections/MediaWithPrefix'

export default buildConfig({
  collections: [Media, MediaWithPrefix],
  plugins: [
    azureStorage({
      collections: {
        media: true,
        'media-with-prefix': {
          prefix,
        },
      },
      allowContainerCreate: process.env.AZURE_STORAGE_ALLOW_CONTAINER_CREATE === 'true',
      baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
    }),
  ],
})
```

### Authentication methods

Azure Blob Storage supports different authentication methods. Choose the one that best fits your deployment environment.

#### Connection string

Use Azure Storage connection string for straightforward authentication:

```ts
azureStorage({
  baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
})
```

#### Azure credentials

Use Azure Identity credentials for enhanced security with managed identities:

```ts
import { DefaultAzureCredential } from '@azure/identity'

azureStorage({
  baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
  credentials: new DefaultAzureCredential(),
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
})
```

**Note:** When using User Managed Identity, set the `AZURE_CLIENT_ID` environment variable with your managed identity's client ID.

### Configuration Options

| Option                 | Description                                                                                              | Default |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------- |
| `enabled`              | Whether or not to enable the plugin                                                                      | `true`  |
| `collections`          | Collections to apply the Azure Blob adapter to                                                           |         |
| `allowContainerCreate` | Whether or not to allow the container to be created if it does not exist                                 | `false` |
| `baseURL`              | Base URL for the Azure Blob storage account (required when using credentials)                            |         |
| `connectionString`     | Azure Blob storage connection string (alternative to credentials + baseURL)                              |         |
| `credentials`          | Azure TokenCredential for authentication (e.g., DefaultAzureCredential). Alternative to connectionString |         |
| `containerName`        | Azure Blob storage container name                                                                        |         |
| `clientUploads`        | Do uploads directly on the client to bypass limits on Vercel.                                            |         |
