import type { ResizeOptions, Sharp, SharpOptions } from 'sharp'

import type { CollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { PayloadComponent } from '../config/types.js'
import type { UploadCollectionSlug } from '../index.js'
import type { PayloadRequest } from '../types/index.js'
import type { WithMetadata } from './optionallyAppendMetadata.js'

export type FileSize = {
  filename: null | string
  filesize: null | number
  height: null | number
  mimeType: null | string
  url: null | string
  width: null | number
}

export type FileSizes = {
  [size: string]: FileSize
}

export type FileData = {
  filename: string
  filesize: number
  focalX?: number
  focalY?: number
  height: number
  mimeType: string
  sizes: FileSizes
  tempFilePath?: string
  url?: string
  width: number
}

export type ProbedImageSize = {
  height: number
  width: number
}

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

export type GenerateImageName = (args: {
  extension: string
  height: number
  originalName: string
  sizeName: string
  width: number
}) => string

export type ImageSize = {
  /**
   * Admin UI options that control how this image size appears in list views.
   */
  admin?: {
    /**
     * Controls visibility of this image size in the collection list view.
     * Defaults to hiding the image size from columns, filters, and group-by to reduce noise.
     *
     * - `column` — whether to hide this size from selectable list columns. @default false
     * - `filter` — whether to hide this size from filter options. @default false
     * - `groupBy` — whether to hide this size from group-by options. @default false
     */
    disabled?: {
      column?: boolean
      filter?: boolean
      groupBy?: boolean
    }
  }
  /**
   * @deprecated prefer position
   */
  crop?: string // comes from sharp package
  formatOptions?: ImageUploadFormatOptions
  /**
   * Generate a custom name for the file of this image size.
   */
  generateImageName?: GenerateImageName
  name: string
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

export type GetAdminThumbnail = (args: { doc: Record<string, unknown> }) => false | null | string

export type AllowList = Array<{
  hostname: string
  pathname?: string
  port?: string
  protocol?: 'http' | 'https'
  search?: string
}>

export type FileAllowList = Array<{
  extensions: string[]
  mimeType: string
}>

export type UploadFilePreviewClientProps = {
  filename: string
  filesize: number
  /** Resolved URL of the file (data.url). */
  fileSrc: string
  height?: number
  mimeType: string
  width?: number
}

type UploadFilePreviewMap = {
  [mimeTypePattern: string]: PayloadComponent
}

type Admin = {
  components?: {
    /**
     * The Controls component to extend the upload controls in the admin panel.
     */
    controls?: PayloadComponent[]
    /**
     * A custom component to render in place of the default Thumbnail in the upload side panel.
     *
     * Can be a single PayloadComponent (renders for all MIME types) or a Record keyed by
     * MIME type patterns. Pattern resolution priority: exact match → category wildcard
     * (e.g. `video/*`) → universal fallback (`*`). Falls back to the default Thumbnail
     * when nothing matches.
     */
    filePreview?: PayloadComponent | UploadFilePreviewMap
  }
}

export type UploadConfig = {
  /**
   * The adapter name to use for uploads. Used for storage adapter telemetry.
   * @default undefined
   */
  adapter?: string
  /**
   * The admin configuration for the upload field.
   */
  admin?: Admin
  /**
   * Represents an admin thumbnail, which can be either a React component or a string.
   * - If a string, it should be one of the image size names.
   * - A function that generates a fully qualified URL for the thumbnail, receives the doc as the only argument.
   **/
  adminThumbnail?: GetAdminThumbnail | string
  /**
   * Allow restricted file types known to be problematic.
   * - If set to `true`, it will allow all file types.
   * - If set to `false`, it will not allow file types and extensions known to be problematic.
   * - This setting is overriden by the `mimeTypes` option.
   * @default false
   */
  allowRestrictedFileTypes?: boolean
  /**
   * Enables bulk upload of files from the list view.
   * @default true
   */
  bulkUpload?: boolean
  /**
   * Appends a cache tag to the image URL when fetching the thumbnail in the admin panel. It may be desirable to disable this when hosting via CDNs with strict parameters.
   *
   * @default true
   */
  cacheTags?: boolean
  /**
   * Sharp constructor options to be passed to the uploaded file.
   * @link https://sharp.pixelplumbing.com/api-constructor/#sharp
   */
  constructorOptions?: SharpOptions
  /**
   * Enables cropping of images.
   * @default true
   */
  crop?: boolean
  /**
   * Disable the ability to save files to disk.
   * @default false
   */
  disableLocalStorage?: boolean
  /**
   * Enable displaying preview of the uploaded file in Upload fields related to this Collection.
   * Can be locally overridden by `displayPreview` option in Upload field.
   * @default false
   */
  displayPreview?: boolean
  /**
   *
   * Accepts existing headers and returns the headers after filtering or modifying.
   * If using this option, you should handle the removal of any sensitive cookies
   * (like payload-prefixed cookies) to prevent leaking session information to external
   * services. By default, Payload automatically filters out payload-prefixed cookies
   * when this option is NOT defined.
   *
   * Useful for adding custom headers to fetch from external providers.
   * @default undefined
   */
  externalFileHeaderFilter?: (headers: Record<string, string>) => Record<string, string>
  /**
   * Field slugs to use for a compound index instead of the default filename index.
   */
  filenameCompoundIndex?: string[]
  /**
   * Require files to be uploaded when creating a document.
   * @default true
   */
  filesRequiredOnCreate?: boolean
  /**
   * Enables focal point positioning for image manipulation.
   * @default true
   */
  focalPoint?: boolean
  /**
   * Format options for the uploaded file. Formatting image sizes needs to be done within each formatOptions individually.
   */
  formatOptions?: ImageUploadFormatOptions
  /**
   * Custom handlers to run when a file is fetched.
   *
   * - If a handler returns a Response, the response will be sent to the client and no further handlers will be run.
   * - If a handler returns null, the next handler will be run.
   * - If no handlers return a response the file will be returned by default.
   *
   * @link https://sharp.pixelplumbing.com/api-output/#toformat
   * @default undefined
   */
  handlers?: ((
    req: PayloadRequest,
    args: {
      doc: TypeWithID
      headers?: Headers
      params: {
        clientUploadContext?: unknown
        collection: string
        filename: string
        prefix?: string
      }
    },
  ) => Promise<Response> | Promise<void> | Response | void)[]
  /**
   * Set to `true` to prevent the admin UI from showing file inputs during document creation, useful for programmatic file generation.
   */
  hideFileInputOnCreate?: boolean
  /**
   * Set to `true` to prevent the admin UI having a way to remove an existing file while editing.
   */
  hideRemoveFile?: boolean
  imageSizes?: ImageSize[]
  /**
   * Restrict mimeTypes in the file picker. Array of valid mime types or mimetype wildcards
   * @example ['image/*', 'application/pdf']
   * @default undefined
   */
  mimeTypes?: string[]
  /**
   * Ability to modify the response headers fetching a file.
   * @default undefined
   */
  modifyResponseHeaders?: ({ headers }: { headers: Headers }) => Headers | void
  /**
   * Controls the behavior of pasting/uploading files from URLs.
   * If set to `false`, fetching from remote URLs is disabled.
   * If an `allowList` is provided, server-side fetching will be enabled for specified URLs.
   *
   * @default true (client-side fetching enabled)
   */
  pasteURL?:
    | {
        allowList: AllowList
      }
    | false
  /**
   * Sharp resize options for the original image.
   * @link https://sharp.pixelplumbing.com/api-resize#resize
   * @default undefined
   */
  resizeOptions?: ResizeOptions
  /**
   *  Skip safe fetch when using server-side fetching for external files from these URLs.
   *  @default false
   */
  skipSafeFetch?: AllowList | boolean
  /**
   * The directory to serve static files from. Defaults to collection slug.
   * @default undefined
   */
  staticDir?: string
  trimOptions?: ImageUploadTrimOptions
  /**
   * Adapter-provided upload instructions. Client config exposes this as a `true` marker without
   * the server-only access and generate functions.
   * @internal
   */
  uploadInstructions?: UploadInstructionsCapability
  /**
   * Optionally append metadata to the image during processing.
   *
   * Can be a boolean or a function.
   *
   * If true, metadata will be appended to the image.
   * If false, no metadata will be appended.
   * If a function, it will receive an object containing the metadata and should return a boolean indicating whether to append the metadata.
   * @default false
   */
  withMetadata?: WithMetadata
}

export type UploadInstructionsAccess = (args: {
  collectionSlug: UploadCollectionSlug
  req: PayloadRequest
}) => boolean | Promise<boolean>

export type UploadInstructionsRequest = {
  collectionSlug: UploadCollectionSlug
  docPrefix?: string
  filename: string
  filesize: number
  mimeType: string
}

export type UploadInstructions = {
  clientUploadContext?: unknown
  filename?: string
} & (
  | {
      data?: unknown
      name: string
      type: 'dispatch'
    }
  | {
      request: {
        headers?: Record<string, string>
        method: 'POST' | 'PUT'
        url: string
      }
      type: 'http'
    }
)

export type GenerateUploadInstructions = (
  args: { req: PayloadRequest } & UploadInstructionsRequest,
) => Promise<UploadInstructions> | UploadInstructions

export type UploadInstructionsCapability = {
  /** Controls access to generating upload instructions. */
  access?: UploadInstructionsAccess
  /** Generates instructions for uploading a file. */
  generate: GenerateUploadInstructions
}
export type checkFileRestrictionsParams = {
  collection: CollectionConfig
  file: File
  req: PayloadRequest
}

export type SanitizedUploadConfig = {
  staticDir: UploadConfig['staticDir']
} & UploadConfig

export type File = {
  /**
   * The buffer of the file.
   */
  data: Buffer
  /**
   * The mimetype of the file.
   */
  mimetype: string
  /**
   * The name of the file.
   */
  name: string
  /**
   * The size of the file in bytes.
   */
  size: number
  /**
   * Path to the temp file on disk when useTempFiles is enabled. In this case file.data will be an empty buffer.
   */
  tempFilePath?: string
}

export type FileToSave = {
  /**
   * The buffer of the file.
   */
  buffer: Buffer
  /**
   * The path to save the file.
   */
  path: string
}

type Crop = {
  height: number
  unit: '%' | 'px'
  width: number
  x: number
  y: number
}

export type FocalPoint = {
  x: number
  y: number
}

export type UploadEdits = {
  crop?: Crop
  focalPoint?: FocalPoint
  heightInPixels?: number
  widthInPixels?: number
}
