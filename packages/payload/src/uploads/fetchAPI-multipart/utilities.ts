// @ts-strict-ignore
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

import type { FetchAPIFileUploadOptions } from '../../config/types.js'

// Parameters for safe file name parsing.
const SAFE_FILE_NAME_REGEX = /[^\w-]/g
const MAX_EXTENSION_LENGTH = 3

// Parameters to generate unique temporary file names:
const TEMP_COUNTER_MAX = 65536
const TEMP_PREFIX = 'tmp'
let tempCounter = 0

/**
 * Logs message to console if options.debug option set to true.
 */
export const debugLog = (options: FetchAPIFileUploadOptions, msg: string) => {
  const opts = options || {}
  if (!opts.debug) {
    return false
  }
  console.log(`Next-file-upload: ${msg}`) // eslint-disable-line
  return true
}

/**
 * Generates unique temporary file name. e.g. tmp-5000-156788789789.
 */
export const getTempFilename = (prefix: string = TEMP_PREFIX) => {
  tempCounter = tempCounter >= TEMP_COUNTER_MAX ? 1 : tempCounter + 1
  return `${prefix}-${tempCounter}-${Date.now()}`
}

type FuncType = (...args: any[]) => any
export const isFunc = (value: any): value is FuncType => {
  return typeof value === 'function'
}

/**
 * Set errorFunc to the same value as successFunc for callback mode.
 */
type ErrorFunc = (resolve: () => void, reject: (err: Error) => void) => (err: Error) => void
const errorFunc: ErrorFunc = (resolve, reject) => (isFunc(reject) ? reject : resolve)

/**
 * Return a callback function for promise resole/reject args.
 * Ensures that callback is called only once.
 */
type PromiseCallback = (resolve: () => void, reject: (err: Error) => void) => (err: Error) => void
export const promiseCallback: PromiseCallback = (resolve, reject) => {
  let hasFired = false
  return (err: Error) => {
    if (hasFired) {
      return
    }

    hasFired = true
    return err ? errorFunc(resolve, reject)(err) : resolve()
  }
}

// The default prototypes for both objects and arrays.
// Used by isSafeFromPollution
const OBJECT_PROTOTYPE_KEYS = Object.getOwnPropertyNames(Object.prototype)
const ARRAY_PROTOTYPE_KEYS = Object.getOwnPropertyNames(Array.prototype)

/**
 * Determines whether a key insertion into an object could result in a prototype pollution
 */
type IsSafeFromPollution = (base: any, key: string) => boolean
export const isSafeFromPollution: IsSafeFromPollution = (base, key) => {
  // We perform an instanceof check instead of Array.isArray as the former is more
  // permissive for cases in which the object as an Array prototype but was not constructed
  // via an Array constructor or literal.
  const TOUCHES_ARRAY_PROTOTYPE = base instanceof Array && ARRAY_PROTOTYPE_KEYS.includes(key)
  const TOUCHES_OBJECT_PROTOTYPE = OBJECT_PROTOTYPE_KEYS.includes(key)

  return !TOUCHES_ARRAY_PROTOTYPE && !TOUCHES_OBJECT_PROTOTYPE
}

/**
 * Build request field/file objects to return
 */
type BuildFields = (instance: any, field: string, value: any) => any
export const buildFields: BuildFields = (instance, field, value) => {
  // Do nothing if value is not set.
  if (value === null || value === undefined) {
    return instance
  }
  instance = instance || Object.create(null)

  if (!isSafeFromPollution(instance, field)) {
    return instance
  }
  // Non-array fields
  if (!instance[field]) {
    instance[field] = value
    return instance
  }
  // Array fields
  if (instance[field] instanceof Array) {
    instance[field].push(value)
  } else {
    instance[field] = [instance[field], value]
  }
  return instance
}

/**
 * Creates a folder if it does not exist
 * for file specified in the path variable
 */
type CheckAndMakeDir = (fileUploadOptions: FetchAPIFileUploadOptions, filePath: string) => boolean
export const checkAndMakeDir: CheckAndMakeDir = (fileUploadOptions, filePath) => {
  if (!fileUploadOptions.createParentPath) {
    return false
  }
  // Check whether folder for the file exists.
  const parentPath = path.dirname(filePath)
  // Create folder if it doesn't exist.
  if (!fs.existsSync(parentPath)) {
    fs.mkdirSync(parentPath, { recursive: true })
  }
  // Checks folder again and return a results.
  return fs.existsSync(parentPath)
}

/**
 * Delete a file.
 */
type DeleteFile = (filePath: string, callback: (args: any) => void) => void
export const deleteFile: DeleteFile = (filePath, callback: (args) => void) =>
  fs.unlink(filePath, callback)

/**
 * Copy file via streams
 */
type CopyFile = (src: string, dst: string, callback: (err: Error) => void) => void
const copyFile: CopyFile = (src, dst, callback) => {
  // cbCalled flag and runCb helps to run cb only once.
  let cbCalled = false
  const runCb = (err?: Error) => {
    if (cbCalled) {
      return
    }
    cbCalled = true
    callback(err)
  }
  // Create read stream
  const readable = fs.createReadStream(src)
  readable.on('error', runCb)
  // Create write stream
  const writable = fs.createWriteStream(dst)
  writable.on('error', (err: Error) => {
    readable.destroy()
    runCb(err)
  })
  writable.on('close', () => runCb())
  // Copy file via piping streams.
  readable.pipe(writable)
}

/**
 * moveFile: moves the file from src to dst.
 * Firstly trying to rename the file if no luck copying it to dst and then deleting src.
 */
type MoveFile = (
  src: string,
  dst: string,
  callback: (err: Error, renamed?: boolean) => void,
) => void
export const moveFile: MoveFile = (src, dst, callback) =>
  fs.rename(src, dst, (err) => {
    if (err) {
      // Try to copy file if rename didn't work.
      copyFile(src, dst, (cpErr) => (cpErr ? callback(cpErr) : deleteFile(src, callback)))
      return
    }
    // File was renamed successfully: Add true to the callback to indicate that.
    callback(null, true)
  })

/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {string} filePath - path to a file.
 */
export const saveBufferToFile = (buffer, filePath, callback) => {
  if (!Buffer.isBuffer(buffer)) {
    return callback(new Error('buffer variable should be type of Buffer!'))
  }
  // Setup readable stream from buffer.
  let streamData = buffer
  const readStream = new Readable()
  readStream._read = () => {
    readStream.push(streamData)
    streamData = null
  }
  // Setup file system writable stream.
  const fstream = fs.createWriteStream(filePath)
  // console.log("Calling saveBuffer");
  fstream.on('error', (err) => {
    // console.log("err cb")
    callback(err)
  })
  fstream.on('close', () => {
    // console.log("close cb");
    callback()
  })
  // Copy file via piping streams.
  readStream.pipe(fstream)
}

/**
 * Decodes uriEncoded file names.
 * @param {Object} opts - middleware options.
 * @param fileName {String} - file name to decode.
 * @returns {String}
 */
const uriDecodeFileName = (opts, fileName) => {
  if (!opts || !opts.uriDecodeFileNames) {
    return fileName
  }
  // Decode file name from URI with checking URI malformed errors.
  // See Issue https://github.com/richardgirges/express-fileupload/issues/342.
  try {
    return decodeURIComponent(fileName)
  } catch (err) {
    const matcher = /(%[a-f\d]{2})/gi
    return fileName
      .split(matcher)
      .map((str) => {
        try {
          return decodeURIComponent(str)
        } catch (err) {
          return ''
        }
      })
      .join('')
  }
}

/**
 * Parses filename and extension and returns object {name, extension}.
 */
type ParseFileNameExtension = (
  preserveExtension: boolean | number,
  fileName: string,
) => {
  extension: string
  name: string
}
export const parseFileNameExtension: ParseFileNameExtension = (preserveExtension, fileName) => {
  const defaultResult = {
    name: fileName,
    extension: '',
  }
  if (!preserveExtension) {
    return defaultResult
  }

  // Define maximum extension length
  const maxExtLength =
    typeof preserveExtension === 'boolean' ? MAX_EXTENSION_LENGTH : preserveExtension

  const nameParts = fileName.split('.')
  if (nameParts.length < 2) {
    return defaultResult
  }

  let extension = nameParts.pop()
  if (extension.length > maxExtLength && maxExtLength > 0) {
    nameParts[nameParts.length - 1] += '.' + extension.substr(0, extension.length - maxExtLength)
    extension = extension.substr(-maxExtLength)
  }

  return {
    name: nameParts.join('.'),
    extension: maxExtLength ? extension : '',
  }
}

/**
 * Parse file name and extension.
 */
type ParseFileName = (opts: FetchAPIFileUploadOptions, fileName: string) => string
export const parseFileName: ParseFileName = (opts, fileName) => {
  // Check fileName argument
  if (!fileName || typeof fileName !== 'string') {
    return getTempFilename()
  }
  // Cut off file name if it's length more then 255.
  let parsedName = fileName.length <= 255 ? fileName : fileName.substr(0, 255)
  // Decode file name if uriDecodeFileNames option set true.
  parsedName = uriDecodeFileName(opts, parsedName)
  // Stop parsing file name if safeFileNames options hasn't been set.
  if (!opts.safeFileNames) {
    return parsedName
  }
  // Set regular expression for the file name.
  const nameRegex =
    typeof opts.safeFileNames === 'object' && opts.safeFileNames instanceof RegExp
      ? opts.safeFileNames
      : SAFE_FILE_NAME_REGEX
  // Parse file name extension.
  const parsedFileName = parseFileNameExtension(opts.preserveExtension, parsedName)
  if (parsedFileName.extension.length) {
    parsedFileName.extension = '.' + parsedFileName.extension.replace(nameRegex, '')
  }

  return parsedFileName.name.replace(nameRegex, '').concat(parsedFileName.extension)
}
