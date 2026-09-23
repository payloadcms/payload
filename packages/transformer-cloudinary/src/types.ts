import type { ConfigOptions } from 'cloudinary'
import type {
  FocalPoint,
  ImageSize,
  PayloadRequest,
  ProbedImageSize,
  UploadCollectionSlug,
  UploadEdits,
} from 'payload'

/**
 * Cloudinary crop mode. Selects how the image is fitted into the requested box.
 * @link https://cloudinary.com/documentation/resizing_and_cropping
 */
export type CloudinaryCropMode =
  | 'crop'
  | 'fill'
  | 'fit'
  | 'lfill'
  | 'limit'
  | 'mfit'
  | 'pad'
  | 'scale'
  | 'thumb'

/**
 * Cloudinary gravity. Selects which part of the image is kept when cropping.
 * `auto` uses Cloudinary's content-aware detection - the main reason to reach
 * for this transformer over a purely local one.
 * @link https://cloudinary.com/documentation/transformation_reference#g_gravity
 */
export type CloudinaryGravity =
  | 'auto'
  | 'center'
  | 'east'
  | 'face'
  | 'faces'
  | 'north'
  | 'north_east'
  | 'north_west'
  | 'south'
  | 'south_east'
  | 'south_west'
  | 'west'

/**
 * Output format. `auto` lets Cloudinary negotiate the best format for the
 * requesting browser; omitting it keeps the source format.
 */
export type CloudinaryFormat = 'auto' | 'avif' | 'gif' | 'jpg' | 'png' | 'webp'

/** Output quality. `auto` lets Cloudinary pick, or pass 1-100. */
export type CloudinaryQuality =
  | 'auto'
  | 'auto:best'
  | 'auto:eco'
  | 'auto:good'
  | 'auto:low'
  | number

/**
 * The transformation applied to one image, in Cloudinary's terms. Mirrors the
 * subset of Cloudinary's transformation surface this package exposes.
 */
export type CloudinaryTransformation = {
  crop?: CloudinaryCropMode
  fetchFormat?: CloudinaryFormat
  gravity?: CloudinaryGravity
  height?: number
  quality?: CloudinaryQuality
  width?: number
  /** Explicit crop rectangle, in source pixels. Used for Admin-selected crops. */
  x?: number
  y?: number
}

/**
 * Image size options implemented by this transformer, registered onto core's
 * `ImageSize` so `imageSizes` entries can carry Cloudinary-specific settings.
 */
export type CloudinaryImageSizeOptions = {
  crop?: CloudinaryCropMode
  formatOptions?: { format: CloudinaryFormat; quality?: CloudinaryQuality }
  gravity?: CloudinaryGravity
  height?: number
  width?: number
  /**
   * When the source is smaller than this size:
   *
   * 1. `undefined` [default]: record the size with null metadata, matching Sharp's behavior
   * 2. `false`: enlarge the source up to the requested size
   * 3. `true`: deliver the source at its own size instead of enlarging
   */
  withoutEnlargement?: boolean
}

declare module 'payload' {
  interface RegisteredImageSizeOptions {
    cloudinary: CloudinaryImageSizeOptions
  }
}

/**
 * A collection's Cloudinary-owned upload-time settings, authored via
 * `cloudinaryTransformer({ collections: { <slug>: {...} } })`. `init()` writes a
 * narrowed, Cloudinary-agnostic projection of `imageSizes`/`crop`/`focalPoint`
 * back onto the sanitized collection's `upload` config for core's own use
 * (Admin UI, field generation); this richer shape is what the transformer reads.
 */
export type CloudinaryCollectionConfig = {
  /** Enable the Admin Panel's crop selector for this collection. */
  crop?: boolean
  /** Enable the Admin Panel's focal point selector for this collection. */
  focalPoint?: boolean
  /** Format and quality applied to the main uploaded file. */
  formatOptions?: { format: CloudinaryFormat; quality?: CloudinaryQuality }
  imageSizes?: ImageSize[]
  /** Transformation applied to the main uploaded file. */
  resizeOptions?: Omit<CloudinaryTransformation, 'x' | 'y'>
}

/** Configurable defaults for dynamic (request-time) transformation. */
export type CloudinaryDynamicDefaults = {
  /** Crop mode when both `width` and `height` are given. @default 'fill' */
  crop?: CloudinaryCropMode
  /** @default undefined (keep the source format) */
  format?: CloudinaryFormat
  /** @default 'center' */
  gravity?: CloudinaryGravity
  /** @default 4096 */
  maxHeight?: number
  /** @default 16_777_216 */
  maxPixels?: number
  /** @default 4096 */
  maxWidth?: number
  /** @default 'auto' */
  quality?: CloudinaryQuality
  /** @default false */
  withoutEnlargement?: boolean
}

/**
 * How a transformed variant reaches the client.
 *
 * - `'proxy'` (default): Payload streams the bytes from Cloudinary, so neither the
 *   Cloudinary URL nor the underlying source URL is exposed, and the response stays
 *   behind the collection's access control.
 * - `'redirect'`: Payload answers `302` with the Cloudinary URL. Cheapest - the
 *   source bytes never pass through Payload - but the variant becomes publicly
 *   reachable and the source URL is disclosed to the client.
 */
export type CloudinaryDeliveryMode = 'proxy' | 'redirect'

/**
 * Resolves the publicly reachable URL that Cloudinary should fetch the source
 * image from. Cloudinary pulls this URL itself, so it must be reachable from the
 * public internet and its host allow-listed in your Cloudinary fetch settings.
 */
export type ResolveSourceURL = (args: {
  collectionSlug: string
  documentID: number | string
  filename: string
  req: PayloadRequest
}) => Promise<string> | string

/**
 * The result of parsing a request's dynamic transformation query parameters.
 * `isRouted: false` means none of the recognized parameters were present at
 * all - an ordinary file read, not a dynamic transformation attempt.
 */
export type DynamicTransformParseResult =
  | {
      error: string
      isRouted: true
      valid: false
    }
  | {
      height?: number
      isRouted: true
      valid: true
      width?: number
      withoutEnlargement?: boolean
    }
  | {
      isRouted: false
    }

export type CloudinaryTransformerOptions = {
  /** Per-collection upload-time image processing settings. */
  collections?: Partial<Record<UploadCollectionSlug, CloudinaryCollectionConfig>>
  /**
   * Cloudinary client configuration. See [Docs](https://cloudinary.com/documentation/node_integration).
   * Anything omitted falls back to `url`, then to `CLOUDINARY_URL`.
   */
  config?: ConfigOptions
  /** @default 'proxy' */
  delivery?: CloudinaryDeliveryMode
  /** Configurable defaults for dynamic (request-time) transformation. */
  dynamic?: CloudinaryDynamicDefaults
  /** @default 'cloudinary' */
  slug?: string
  /**
   * Overrides how the publicly reachable source URL is resolved for a dynamic
   * request. Defaults to the requested file's own `url`, resolved against the
   * config's `serverURL`.
   */
  sourceURL?: ResolveSourceURL
  /**
   * Folder the short-lived upload-time originals are written to before their
   * derived sizes are pulled back. Each is deleted once its upload completes.
   *
   * @default 'payload-transformer-tmp'
   */
  uploadFolder?: string
  /**
   * Cloudinary URL, in the form `cloudinary://<api_key>:<api_secret>@<cloud_name>`.
   *
   * @default process.env.CLOUDINARY_URL
   */
  url?: string
}

/**
 * Credentials resolved once and merged into every Cloudinary call, rather than
 * mutated into the SDK's global singleton, so multiple transformer or storage
 * instances can target different clouds in one Payload config.
 */
export type ResolvedCloudinaryConfig = {
  api_key: string
  api_secret: string
  cloud_name: string
} & ConfigOptions

/**
 * `options` for the one-file-in/one-file-out `transformFile` primitive, computed
 * by `prepareUpload` for each task it hands to the injected `transform` callback.
 * The derived URL is already resolved by then, so `transformFile` only fetches it.
 */
export type CloudinaryUploadTaskOptions = {
  /** Cloudinary URL of the derived asset for this task. */
  derivedURL: string
  fileExtension: string
  kind: 'main' | 'size'
  mimeType: string
}

/** Per-task plan built from a single Cloudinary upload's eager transformations. */
export type CloudinaryUploadTask = {
  fieldPath: 'filename' | `sizes.${string}`
  height?: number
  options?: CloudinaryUploadTaskOptions
  width?: number
}

export type UploadCropContext = {
  cropData: NonNullable<UploadEdits['crop']>
  heightInPixels: number
  originalDimensions: ProbedImageSize
  widthInPixels: number
}

export type { FocalPoint }
