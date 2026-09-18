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
- When deploying to Vercel, server uploads are limited to 4.5MB. Set `clientUploads` to `true` to use upload instructions and send files directly to Azure.

### Authentication

The adapter supports two mutually exclusive authentication methods.

#### Connection string

```ts
azureStorage({
  // ...
  baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
})
```

#### Entra ID / managed identity

Pass any [`TokenCredential`](https://learn.microsoft.com/en-us/javascript/api/@azure/core-auth/tokencredential) from `@azure/identity` as `credential` to authenticate without storing secrets — for example with a managed identity on Azure App Service or a workload identity on AKS:

```ts
import { DefaultAzureCredential } from '@azure/identity'

azureStorage({
  // ...
  baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL, // https://<account>.blob.core.windows.net
  credential: new DefaultAzureCredential(),
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
})
```

Requirements when using `credential`:

- `baseURL` must be the storage account's blob endpoint (`https://<account>.blob.core.windows.net`), not a CDN URL, since it is also used to connect to the account.
- The identity needs the **Storage Blob Data Contributor** role on the storage account or container. Client uploads (`clientUploads`) sign upload URLs with a [user delegation SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-user-delegation-sas), whose `generateUserDelegationKey` action is included in that role.
- For a user-assigned managed identity with `DefaultAzureCredential`, set the `AZURE_CLIENT_ID` environment variable to the identity's client ID (or use `ManagedIdentityCredential` with an explicit client ID).

> **Note:** SAS-based connection strings (containing `SharedAccessSignature=`) work for server uploads but cannot sign upload URLs, so they are not supported with `clientUploads`.

### Client uploads and CORS

Client uploads (`clientUploads: true`) use the Azure Blob SDK, which splits large files into blocks and therefore avoids the ~5GB limit of a single upload request. Because the SDK sends `x-ms-*` headers, the browser issues a CORS preflight, so your storage account's CORS rules must allow the `OPTIONS` and `PUT` methods **and** the required headers.

Configure a CORS rule on the Blob service (Storage account → **Resource sharing (CORS)**):

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Allowed origins | Your site origin (e.g. `https://example.com`)            |
| Allowed methods | `GET,PUT,OPTIONS` (add `HEAD` if reading in-browser)     |
| Allowed headers | `*` (or at minimum `x-ms-*,content-type,content-length`) |
| Exposed headers | `*`                                                      |
| Max age         | `3600`                                                   |

> If you previously configured CORS for the older single-`PUT` upload flow, broaden `Allowed headers` to include the `x-ms-*` headers when upgrading.

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

### Configuration Options

| Option                 | Description                                                                                            | Default |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------- |
| `enabled`              | Whether or not to enable the plugin                                                                    | `true`  |
| `collections`          | Collections to apply the Azure Blob adapter to                                                         |         |
| `allowContainerCreate` | Whether or not to allow the container to be created if it does not exist                               | `false` |
| `baseURL`              | Base URL for the Azure Blob storage account (the blob endpoint when using `credential`)                |         |
| `connectionString`     | Azure Blob storage connection string (mutually exclusive with `credential`)                            |         |
| `credential`           | Entra ID `TokenCredential` (e.g. `DefaultAzureCredential`), mutually exclusive with `connectionString` |         |
| `containerName`        | Azure Blob storage container name                                                                      |         |
| `clientUploads`        | Upload directly to Azure instead of through Payload.                                                   |         |
