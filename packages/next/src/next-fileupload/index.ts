import path from 'path'

import type { BusboyConfig } from 'busboy'

import { processMultipart } from './processMultipart'
import { isEligibleRequest } from './isEligibleRequest'
import { debugLog } from './utilities'

const DEFAULT_OPTIONS = {
  debug: false,
  uploadTimeout: 60000,
  fileHandler: false,
  uriDecodeFileNames: false,
  safeFileNames: false,
  preserveExtension: false,
  abortOnLimit: false,
  responseOnLimit: 'File size limit has been reached',
  limitHandler: false,
  createParentPath: false,
  parseNested: false,
  useTempFiles: false,
  tempFileDir: path.join(process.cwd(), 'tmp'),
}

export type FileShape = {
  name: string
  data: Buffer
  size: number
  encoding: string
  tempFilePath: string
  truncated: boolean
  mimetype: string
  md5: Buffer | string
  mv: (filePath: string, callback: () => void) => void | Promise<void>
}

export type NextFileUploadOptions = {
  /**
   * Automatically creates the directory path specified in `.mv(filePathName)`
   * @default false
   */
  createParentPath?: boolean | undefined
  /**
   * Applies uri decoding to file names if set `true`.
   * @default false
   */
  uriDecodeFileNames?: boolean | undefined
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
  safeFileNames?: boolean | RegExp | undefined
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
   * Returns a HTTP 413 when the file is bigger than the size limit if `true`.
   * Otherwise, it will add a `truncated = true` to the resulting file structure.
   * @default false
   */
  abortOnLimit?: boolean | undefined
  /**
   * Response which will be send to client if file size limit exceeded when `abortOnLimit` set to `true`.
   * @default 'File size limit has been reached'
   */
  responseOnLimit?: string | undefined
  /**
   * User defined limit handler which will be invoked if the file is bigger than configured limits.
   * @default false
   */
  limitHandler?: boolean | ((args: { request: Request; size: number }) => void) | undefined
  /**
   * By default this module uploads files into RAM.
   * Setting this option to `true` turns on using temporary files instead of utilising RAM.
   * This avoids memory overflow issues when uploading large files or in case of uploading
   * lots of files at same time.
   * @default false
   */
  useTempFiles?: boolean | undefined
  /**
   * Path to store temporary files.
   * Used along with the `useTempFiles` option. By default this module uses `'tmp'` folder
   * in the current working directory.
   * You can use trailing slash, but it is not necessary.
   * @default './tmp'
   */
  tempFileDir?: string | undefined
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
   * Turn on/off upload process logging. Can be useful for troubleshooting.
   * @default false
   */
  debug?: boolean | undefined
  /**
   * This defines how long to wait for data before aborting. Set to `0` if you want to turn off timeout checks.
   * @default 60_000
   */
  uploadTimeout?: number | undefined
} & Partial<BusboyConfig>

type NextFileUploadResponseFile = {
  data: Buffer
  mimetype: string
  name: string
  size: number
  tempFilePath?: string
}

export type NextFileUploadResponse = {
  files: Record<string, NextFileUploadResponseFile>
  fields: Record<string, string>
  error?: {
    code: number
    message: string
  }
}

type NextFileUpload = (args: {
  options?: NextFileUploadOptions
  request: Request
}) => Promise<NextFileUploadResponse>
export const nextFileUpload: NextFileUpload = async ({ request, options }) => {
  const uploadOptions = { ...DEFAULT_OPTIONS, ...options }
  if (!isEligibleRequest(request)) {
    debugLog(uploadOptions, 'Request is not eligible for file upload!')
    return {
      files: undefined,
      fields: undefined,
      error: {
        code: 500,
        message: 'Request is not eligible for file upload',
      },
    }
  } else {
    return processMultipart({ options: uploadOptions, request })
  }
}
