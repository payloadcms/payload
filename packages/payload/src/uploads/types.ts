import type express from 'express'
import type serveStatic from 'serve-static'
import type { ResizeOptions, Sharp } from 'sharp'

import type { PayloadRequest } from '../types/index.js'

export type FileSize = {
  filename: null | string
  filesize: null | number
  height: null | number
  mimeType: null | string
  width: null | number
}

export type FileSizes = {
  [size: string]: FileSize
}

export type FileData = {
  filename: string
  filesize: number
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
 * Params sent to the sharp toFormat() function
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

export type ImageSize = Omit<ResizeOptions, 'withoutEnlargement'> & {
  /**
   * @deprecated prefer position
   */
  crop?: string // comes from sharp package
  formatOptions?: ImageUploadFormatOptions
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
}

export type GetAdminThumbnail = (args: { doc: Record<string, unknown> }) => false | null | string

export type UploadConfig = {
  /**
   * Represents an admin thumbnail, which can be either a React component or a string.
   * - If a string, it should be one of the image size names.
   * - If a React component, register a function that generates the thumbnail URL using the `useAdminThumbnail` hook.
   **/
  adminThumbnail?: GetAdminThumbnail | string
  crop?: boolean
  disableLocalStorage?: boolean
  filesRequiredOnCreate?: boolean
  focalPoint?: boolean
  /** Options for original upload file only. For sizes, set each formatOptions individually. */
  formatOptions?: ImageUploadFormatOptions
  handlers?: ((
    req: PayloadRequest,
    args: { params: { collection: string; filename: string } },
  ) => Promise<Response> | Response)[]
  imageSizes?: ImageSize[]
  mimeTypes?: string[]
  resizeOptions?: ResizeOptions
  staticDir?: string
  staticOptions?: serveStatic.ServeStaticOptions<express.Response<any, Record<string, any>>>
  trimOptions?: ImageUploadTrimOptions
}

export type SanitizedUploadConfig = UploadConfig & {
  staticDir: UploadConfig['staticDir']
}

export type File = {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

export type FileToSave = {
  buffer: Buffer
  path: string
}
