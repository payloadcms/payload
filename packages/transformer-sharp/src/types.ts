import type {
  FocalPoint,
  ImageSize,
  PayloadRequest,
  ProbedImageSize,
  UploadCollectionSlug,
  UploadEdits,
} from 'payload'
import type { FitEnum, ResizeOptions, Sharp, Metadata as SharpMetadata, SharpOptions } from 'sharp'

/**
 * Params sent to the sharp `toFormat()` function
 * @link https://sharp.pixelplumbing.com/api-output#toformat
 */
export type ImageUploadFormatOptions = {
  format: Parameters<Sharp['toFormat']>[0]
  options?: Parameters<Sharp['toFormat']>[1]
}

/**
 * Params sent to the sharp trim() function
 * @link https://sharp.pixelplumbing.com/api-resize#trim
 */
export type ImageUploadTrimOptions = Parameters<Sharp['trim']>[0]

export type WithMetadata =
  | ((options: { metadata: SharpMetadata; req: PayloadRequest }) => Promise<boolean>)
  | boolean

/**
 * Image size options implemented by Payload's default Sharp image processor.
 */
export type SharpImageSizeOptions = {
  /**
   * @deprecated prefer position
   */
  crop?: string // comes from sharp package
  formatOptions?: ImageUploadFormatOptions
  trimOptions?: ImageUploadTrimOptions
  /**
   * When an uploaded image is smaller than the defined image size, we have 3 options:
   *
   * `undefined | false | true`
   *
   * 1. `undefined` [default]: uploading images with smaller width AND height than the image size will return null
   * 2. `false`: always enlarge images to the image size
   * 3. `true`: if the image is smaller than the image size, return the original image
   */
  withoutEnlargement?: ResizeOptions['withoutEnlargement']
} & Omit<ResizeOptions, 'withoutEnlargement'>

declare module 'payload' {
  interface RegisteredImageSizeOptions {
    sharp: SharpImageSizeOptions
  }
}

/**
 * A collection's Sharp-owned upload-time settings, authored via
 * `sharpTransformer({ collections: { <slug>: {...} } })`. `init()` writes a
 * narrowed, Sharp-agnostic projection of `imageSizes`/`crop`/`focalPoint` back
 * onto the sanitized collection's `upload` config for core's own use (Admin UI,
 * field generation); this richer shape is what the transformer itself reads.
 */
export type SharpCollectionConfig = {
  constructorOptions?: SharpOptions
  crop?: boolean
  focalPoint?: boolean
  formatOptions?: ImageUploadFormatOptions
  imageSizes?: ImageSize[]
  resizeOptions?: ResizeOptions
  trimOptions?: ImageUploadTrimOptions
  withMetadata?: WithMetadata
}

/**
 * Matches core's (soon-removed) `SharpDependency` shape, for advanced injection
 * of a compatible custom Sharp build or version via `sharpTransformer({ sharp })`.
 */
export type SharpDependency = (
  input?:
    | ArrayBuffer
    | Buffer
    | Float32Array
    | Float64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | string
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array,
  options?: SharpOptions,
) => Sharp

export type SharpDynamicDefaults = {
  /** @default 'cover' */
  fit?: keyof FitEnum
  /** @default 4096 */
  maxHeight?: number
  /** @default 16_777_216 */
  maxPixels?: number
  /** @default 4096 */
  maxWidth?: number
  /** @default 'center' */
  position?: ResizeOptions['position']
  /** @default false */
  withoutEnlargement?: boolean
}

/**
 * The result of parsing a request's dynamic resize query parameters.
 * `isRouted: false` means none of the recognized parameters were present at
 * all — an ordinary file read, not a dynamic transformation attempt.
 */
export type DynamicResizeParseResult =
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

export type SharpTransformerOptions = {
  /** Per-collection upload-time image processing settings. */
  collections?: Partial<Record<UploadCollectionSlug, SharpCollectionConfig>>
  /** Configurable defaults for dynamic (request-time) resizing. */
  dynamic?: SharpDynamicDefaults
  /** Inject a compatible custom Sharp build or version. Defaults to the bundled dependency. */
  sharp?: SharpDependency
  /** @default 'sharp' */
  slug?: string
}

/**
 * `options` for the one-file-in/one-file-out `transformFile` primitive, computed
 * by `prepareLegacyUpload` for each task it hands to the injected `transform`
 * callback: the main file (optionally a crop), or one named legacy image size.
 */
export type SharpUploadTaskOptions =
  | {
      collectionUpload: SharpCollectionConfig
      crop?: {
        cropData: NonNullable<UploadEdits['crop']>
        heightInPixels: number
        originalDimensions: ProbedImageSize
        widthInPixels: number
      }
      kind: 'main'
    }
  | {
      collectionUpload: SharpCollectionConfig
      focalPoint?: FocalPoint
      imageResizeConfig: ImageSize
      kind: 'size'
      originalDimensions: ProbedImageSize
    }
