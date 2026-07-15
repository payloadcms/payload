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
- When deploying to Vercel, server uploads are limited with 4.5MB. Set `clientUploads` to `true` to do uploads directly on the client.

### Large client uploads (files over ~5GB)

By default, client uploads (`clientUploads: true`) send each file in a single request, which Azure caps at ~5GB. To upload larger files, set `chunkLargeFiles: true`:

```ts
azureStorage({
  // ...
  clientUploads: {
    chunkLargeFiles: true,
  },
})
```

This uploads through the Azure Blob SDK, which splits the file into blocks (`Put Block` + `Put Block List`) and raises the limit to Azure's block-blob maximum (~190TiB).

Because the SDK sends additional `x-ms-*` headers, the browser issues a CORS preflight, so your storage account's CORS rules must allow the `OPTIONS` and `PUT` methods **and** those headers. Configure a CORS rule on the Blob service (Storage account → **Resource sharing (CORS)**):

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Allowed origins | Your site origin (e.g. `https://example.com`)            |
| Allowed methods | `GET,PUT,OPTIONS` (add `HEAD` if reading in-browser)     |
| Allowed headers | `*` (or at minimum `x-ms-*,content-type,content-length`) |
| Exposed headers | `*`                                                      |
| Max age         | `3600`                                                   |

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

| Option                 | Description                                                              | Default |
| ---------------------- | ------------------------------------------------------------------------ | ------- |
| `enabled`              | Whether or not to enable the plugin                                      | `true`  |
| `collections`          | Collections to apply the Azure Blob adapter to                           |         |
| `allowContainerCreate` | Whether or not to allow the container to be created if it does not exist | `false` |
| `baseURL`              | Base URL for the Azure Blob storage account                              |         |
| `connectionString`     | Azure Blob storage connection string                                     |         |
| `containerName`        | Azure Blob storage container name                                        |         |
| `clientUploads`        | Do uploads directly on the client to bypass limits on Vercel.            |         |
