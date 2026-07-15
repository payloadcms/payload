# Payload EXIF Plugin

Extract EXIF metadata from uploaded images and store it on Payload upload collections.

## Installation

```bash
pnpm add @payloadcms/plugin-exif
```

## Usage

Add the plugin to your Payload config and point it at your upload-enabled collections:

```ts
import { buildConfig } from 'payload'
import { exifPlugin } from '@payloadcms/plugin-exif'

export default buildConfig({
  // ...
  plugins: [
    exifPlugin({
      collections: ['media'],
    }),
  ],
})
```

## Options

| Option        | Type               | Description                                                                                                                             |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `collections` | `CollectionSlug[]` | Upload-enabled collection slugs to extract EXIF for.                                                                                    |
| `disabled`    | `boolean`          | Disable extraction without removing the plugin. Fields are still added so the database schema stays stable; the upload hook is skipped. |
| `fieldName`   | `string`           | Group field name used to store EXIF data. Defaults to `'exif'`.                                                                         |

## Stored data

For each configured collection the plugin adds a group field (named `exif` by default) with the following shape:

```ts
{
  cameraMake: null | string
  cameraModel: null | string
  latitude: null | number
  longitude: null | number
  raw: Record<string, unknown>
  takenAt: null | string
}
```
