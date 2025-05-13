import type { FetchAPIFileUploadOptions } from '../../config/types.js'
import type { FileShape } from './index.js'

import {
  checkAndMakeDir,
  debugLog,
  isFunc,
  moveFile,
  promiseCallback,
  saveBufferToFile,
} from './utilities.js'

type MoveFile = (
  filePath: string,
  options: FileFactoryOptions,
  fileUploadOptions: FetchAPIFileUploadOptions,
) => (resolve: () => void, reject: () => void) => void

/**
 * Returns Local function that moves the file to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 */
const moveFromTemp: MoveFile = (filePath, options, fileUploadOptions) => (resolve, reject) => {
  debugLog(fileUploadOptions, `Moving temporary file ${options.tempFilePath} to ${filePath}`)
  moveFile(options.tempFilePath, filePath, promiseCallback(resolve, reject))
}

/**
 * Returns Local function that moves the file from buffer to a different location on the filesystem
 * which takes two function arguments to make it compatible w/ Promise or Callback APIs
 */
const moveFromBuffer: MoveFile = (filePath, options, fileUploadOptions) => (resolve, reject) => {
  debugLog(fileUploadOptions, `Moving uploaded buffer to ${filePath}`)
  saveBufferToFile(options.buffer, filePath, promiseCallback(resolve, reject))
}

type FileFactoryOptions = {
  buffer: Buffer
  encoding: string
  hash: Buffer | string
  mimetype: string
  name: string
  size: number
  tempFilePath: string
  truncated: boolean
}
type FileFactory = (
  options: FileFactoryOptions,
  fileUploadOptions: FetchAPIFileUploadOptions,
) => FileShape
export const fileFactory: FileFactory = (options, fileUploadOptions) => {
  // see: https://github.com/richardgirges/express-fileupload/issues/14
  // firefox uploads empty file in case of cache miss when f5ing page.
  // resulting in unexpected behavior. if there is no file data, the file is invalid.
  // if (!fileUploadOptions.useTempFiles && !options.buffer.length) return;

  // Create and return file object.
  return {
    name: options.name,
    data: options.buffer,
    encoding: options.encoding,
    md5: options.hash,
    mimetype: options.mimetype,
    mv: (filePath: string, callback) => {
      // Define a proper move function.
      const moveFunc = fileUploadOptions.useTempFiles
        ? moveFromTemp(filePath, options, fileUploadOptions)
        : moveFromBuffer(filePath, options, fileUploadOptions)
      // Create a folder for a file.
      checkAndMakeDir(fileUploadOptions, filePath)
      // If callback is passed in, use the callback API, otherwise return a promise.
      const defaultReject = () => undefined
      return isFunc(callback) ? moveFunc(callback, defaultReject) : new Promise(moveFunc)
    },
    size: options.size,
    tempFilePath: options.tempFilePath,
    truncated: options.truncated,
  }
}
