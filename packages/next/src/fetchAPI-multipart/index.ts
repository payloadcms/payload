import type { BusboyConfig } from 'busboy'

import path from 'path'
import { APIError } from 'payload'

import { isEligibleRequest } from './isEligibleRequest.js'
import { processMultipart } from './processMultipart.js'
import { debugLog } from './utilities.js'

const DEFAULT_OPTIONS = {
  abortOnLimit: false,
  createParentPath: false,
  debug: false,
  fileHandler: false,
  limitHandler: false,
  parseNested: false,
  preserveExtension: false,
  responseOnLimit: 'File size limit has been reached',
  safeFileNames: false,
  tempFileDir: path.join(process.cwd(), 'tmp'),
  uploadTimeout: 60000,
  uriDecodeFileNames: false,
  useTempFiles: false,
}

export type FileShape = {
  data: Buffer
  encoding: string
  md5: Buffer | string
  mimetype: string
  mv: (filePath: string, callback: () => void) => Promise<void> | void
  name: string
  size: number
  tempFilePath: string
  truncated: boolean
}

export type FetchAPIFileUploadOptions = {
  /**
   * Returns a HTTP 413 when the file is bigger than the size limit if `true`.
   * Otherwise, it will add a `truncated = true` to the resulting file structure.
   * @default false
   */
  abortOnLimit?: boolean | undefined
  /**
   * Automatically creates the directory path specified in `.mv(filePathName)`
   * @default false
   */
  createParentPath?: boolean | undefined
  /**
   * Turn on/off upload process logging. Can be useful for troubleshooting.
   * @default false
   */
  debug?: boolean | undefined
  /**
   * User defined limit handler which will be invoked if the file is bigger than configured limits.
   * @default false
   */
  limitHandler?: ((args: { request: Request; size: number }) => void) | boolean | undefined
  /**
   * By default, `req.body` and `req.files` are flattened like this:
   * `{'name': 'John', 'hobbies[0]': 'Cinema', 'hobbies[1]': 'Bike'}
   *
   * When this option is enabled they are parsed in order to be nested like this:
   * `{'name': 'John', 'hobbies': ['Cinema', 'Bike']}`
   * @default false
   */
  parseNested?: boolean | undefined
  /**
   * Preserves filename extension when using `safeFileNames` option.
   * If set to `true`, will default to an extension length of `3`.
   * If set to `number`, this will be the max allowable extension length.
   * If an extension is smaller than the extension length, it remains untouched. If the extension is longer,
   * it is shifted.
   * @default false
   *
   * @example
   * // true
   * app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));
   * // myFileName.ext --> myFileName.ext
   *
   * @example
   * // max extension length 2, extension shifted
   * app.use(fileUpload({ safeFileNames: true, preserveExtension: 2 }));
   * // myFileName.ext --> myFileNamee.xt
   */
  preserveExtension?: boolean | number | undefined
  /**
   * Response which will be send to client if file size limit exceeded when `abortOnLimit` set to `true`.
   * @default 'File size limit has been reached'
   */
  responseOnLimit?: string | undefined
  /**
   * Strips characters from the upload's filename.
   * You can use custom regex to determine what to strip.
   * If set to `true`, non-alphanumeric characters _except_ dashes and underscores will be stripped.
   * This option is off by default.
   * @default false
   *
   * @example
   * // strip slashes from file names
   * app.use(fileUpload({ safeFileNames: /\\/g }))
   *
   * @example
   * app.use(fileUpload({ safeFileNames: true }))
   */
  safeFileNames?: RegExp | boolean | undefined
  /**
   * Path to store temporary files.
   * Used along with the `useTempFiles` option. By default this module uses `'tmp'` folder
   * in the current working directory.
   * You can use trailing slash, but it is not necessary.
   * @default './tmp'
   */
  tempFileDir?: string | undefined
  /**
   * This defines how long to wait for data before aborting. Set to `0` if you want to turn off timeout checks.
   * @default 60_000
   */
  uploadTimeout?: number | undefined
  /**
   * Applies uri decoding to file names if set `true`.
   * @default false
   */
  uriDecodeFileNames?: boolean | undefined
  /**
   * By default this module uploads files into RAM.
   * Setting this option to `true` turns on using temporary files instead of utilising RAM.
   * This avoids memory overflow issues when uploading large files or in case of uploading
   * lots of files at same time.
   * @default false
   */
  useTempFiles?: boolean | undefined
} & Partial<BusboyConfig>

type FetchAPIFileUploadResponseFile = {
  data: Buffer
  mimetype: string
  name: string
  size: number
  tempFilePath?: string
}

export type FetchAPIFileUploadResponse = {
  error?: APIError
  fields: Record<string, string>
  files: Record<string, FetchAPIFileUploadResponseFile>
}

type FetchAPIFileUpload = (args: {
  options?: FetchAPIFileUploadOptions
  request: Request
}) => Promise<FetchAPIFileUploadResponse>
export const fetchAPIFileUpload: FetchAPIFileUpload = async ({ options, request }) => {
  const uploadOptions: FetchAPIFileUploadOptions = { ...DEFAULT_OPTIONS, ...options }
  if (!isEligibleRequest(request)) {
    debugLog(uploadOptions, 'Request is not eligible for file upload!')
    return {
      error: new APIError('Request is not eligible for file upload', 500),
      fields: undefined,
      files: undefined,
    }
  } else {
    return processMultipart({ options: uploadOptions, request })
  }
}
