# Payload EXIF Plugin

A plugin for [Payload](https://github.com/payloadcms/payload) that extracts EXIF metadata from uploaded images and stores it on your upload-enabled collections.

## Features

- Automatically parses EXIF metadata from images on upload
- Stores the complete EXIF payload as a queryable JSON blob
- Promotes the capture date to an indexed `date` field for fast sorting and filtering
- Promotes GPS coordinates to a `point` field for geospatial queries
- Fails gracefully: images without EXIF (or in unsupported formats) are stored normally with empty metadata

## Installation

```bash
pnpm add @payloadcms/plugin-exif
```

## Basic Usage

In your [Payload Config](https://payloadcms.com/docs/configuration/overview), add the plugin and point it at your upload-enabled collections:

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

On every create or update that includes a file, the plugin parses the uploaded image and writes the extracted metadata into an `exif` group field on the document.

## Options

| Option        | Type               | Description                                                                                                                             |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `collections` | `CollectionSlug[]` | Upload-enabled collection slugs to extract EXIF for.                                                                                    |
| `disabled`    | `boolean`          | Disable extraction without removing the plugin. Fields are still added so the database schema stays stable; the upload hook is skipped. |
| `fieldName`   | `string`           | Group field name used to store EXIF data. Defaults to `'exif'`.                                                                         |

## Stored Data

For each configured collection the plugin appends a read-only group field (named `exif` by default) with the following shape:

```ts
{
  exif: {
    // Every EXIF tag the parser could read, stored verbatim.
    raw: Record<string, unknown> | null
    // Capture date, promoted from DateTimeOriginal / CreateDate / ModifyDate. Indexed.
    takenAt: string | null
    // GPS coordinates as a Payload point: [longitude, latitude]. Null when unavailable.
    location: [number, number] | null
  }
}
```

- **`raw`** — a `json` field containing the full, unmodified EXIF object returned by the parser. This is where every tag lives (camera make/model, lens, exposure, orientation, and any other embedded tag).
- **`takenAt`** — a `date` field, `index: true`, derived from the first available of `DateTimeOriginal`, `CreateDate`, or `ModifyDate`. Use it to sort or filter uploads chronologically.
- **`location`** — a `point` field holding `[longitude, latitude]` (Payload/GeoJSON coordinate order). It is `null` unless both a latitude and longitude are present in the EXIF GPS data.

Only `takenAt` and `location` are promoted to first-class fields. Everything else stays inside `raw` — see below for how to query it.

## Querying Non-Promoted Attributes

Attributes such as camera make and model are not promoted to dedicated fields; they live inside the `raw` JSON blob. You can filter or select them using dot notation against the `raw` object.

```ts
// Find all photos taken with an Apple device.
const applePhotos = await payload.find({
  collection: 'media',
  where: {
    'exif.raw.Make': {
      equals: 'Apple',
    },
  },
})

// Filter by camera model.
const iphone13Pro = await payload.find({
  collection: 'media',
  where: {
    'exif.raw.Model': {
      equals: 'iPhone 13 Pro',
    },
  },
})
```

The promoted fields query like any other Payload field:

```ts
// Uploads captured in 2024, newest first.
const recent = await payload.find({
  collection: 'media',
  sort: '-exif.takenAt',
  where: {
    'exif.takenAt': {
      greater_than_equal: '2024-01-01T00:00:00.000Z',
    },
  },
})
```

> Note: the exact set of available keys inside `raw` depends on the source image. Different cameras and phones embed different tags, and some images have their EXIF stripped entirely (in which case `raw` is `null`). Inspect the stored `raw` object for a sample upload to discover which keys are available for your content.

## Privacy: GPS and Serial Data Are Stored As-Is

EXIF metadata can contain sensitive information — most notably **GPS coordinates** (where a photo was taken) and, on some devices, **camera/lens serial numbers**. This plugin stores the parsed EXIF payload **verbatim** in the `raw` JSON field, and promotes GPS coordinates into the `location` point field. Nothing is redacted or filtered.

If your project exposes uploads publicly (via the REST/GraphQL API, the Local API, or the admin panel), this data is exposed alongside the rest of the document. If you need to restrict who can read location or other sensitive metadata, use Payload's [field-level access control](https://payloadcms.com/docs/access-control/fields) to gate the `exif` group (or specific sub-fields) — for example, by overriding the `read` access function so only authenticated or privileged users receive it.

You are responsible for ensuring your handling of this data complies with your privacy obligations.

## Supported Formats

EXIF parsing is powered by [`exifr`](https://github.com/MikeKovarik/exifr). JPEG, TIFF, and PNG are verified in this package's test suite. `exifr` also documents support for HEIC/HEIF (common on modern iPhones), but that path is currently **unverified** in this package — treat HEIC support as best-effort until a real fixture confirms it. Images in unsupported formats, or with no embedded EXIF, are stored normally with empty (`null`) metadata rather than erroring.

## Database Compatibility

The `location` field uses Payload's `point` type. On MongoDB and Postgres this maps to a native geospatial type. On SQLite, `point` degrades gracefully to a JSON `text` column (with no geospatial index), so uploads and EXIF storage still work — you simply cannot run geospatial queries against `location`.

## Links

- [Source code](https://github.com/payloadcms/payload/tree/main/packages/plugin-exif)
- [Issue tracker](https://github.com/payloadcms/payload/issues)
