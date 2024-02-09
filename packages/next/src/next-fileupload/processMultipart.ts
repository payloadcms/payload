import Busboy from 'busboy'
import { createUploadTimer } from './uploadTimer'
import { fileFactory } from './fileFactory'
import { tempFileHandler, memHandler } from './handlers'

import { processNested } from './processNested'
import { isFunc, debugLog, buildFields, parseFileName } from './utilities'
import { NextFileUploadOptions, NextFileUploadResponse } from '.'
import { APIError } from 'payload/errors'

const waitFlushProperty = Symbol('wait flush property symbol')

type ProcessMultipart = (args: {
  options: NextFileUploadOptions
  request: Request
}) => Promise<NextFileUploadResponse>
export const processMultipart: ProcessMultipart = async ({ request, options }) => {
  let parsingRequest = true
  let result: NextFileUploadResponse = {
    fields: undefined,
    files: undefined,
  }

  const headersObject = {}
  request.headers.forEach((value, name) => {
    headersObject[name] = value
  })

  const busboy = Busboy({ ...options, headers: headersObject })

  // Build multipart req.body fields
  busboy.on('field', (field, val) => {
    result.fields = buildFields(result.fields, field, val)
  })

  // Build req.files fields
  busboy.on('file', (field, file, info) => {
    // Parse file name(cutting huge names, decoding, etc..).
    const { filename: name, encoding, mimeType: mime } = info
    const filename = parseFileName(options, name)

    // Define methods and handlers for upload process.
    const { dataHandler, getFilePath, getFileSize, getHash, complete, cleanup, getWritePromise } =
      options.useTempFiles
        ? tempFileHandler(options, field, filename) // Upload into temporary file.
        : memHandler(options, field, filename) // Upload into RAM.

    const writePromise = options.useTempFiles
      ? getWritePromise().catch((err) => {
          busboy.end()
          cleanup()
        })
      : getWritePromise()

    const uploadTimer = createUploadTimer(options.uploadTimeout, () => {
      file.removeAllListeners('data')
      file.resume()
      const err = new Error(`Upload timeout for ${field}->${filename}, bytes:${getFileSize()}`)
      return file.destroy(err)
    })

    file.on('limit', () => {
      debugLog(options, `Size limit reached for ${field}->${filename}, bytes:${getFileSize()}`)
      uploadTimer.clear()

      if (isFunc(options.limitHandler)) {
        options.limitHandler({ request, size: getFileSize() })
      }

      // Return error and cleanup files if abortOnLimit set.
      if (options.abortOnLimit) {
        debugLog(options, `Aborting upload because of size limit ${field}->${filename}.`)
        cleanup()
        parsingRequest = false
        throw new APIError(options.responseOnLimit, 413, { size: getFileSize() })
      }
    })

    file.on('data', (data) => {
      uploadTimer.set()
      dataHandler(data)
    })

    file.on('end', () => {
      const size = getFileSize()
      debugLog(options, `Upload finished ${field}->${filename}, bytes:${size}`)
      uploadTimer.clear()

      if (!name && size === 0) {
        if (options.useTempFiles) {
          cleanup()
          debugLog(options, `Removing the empty file ${field}->${filename}`)
        }
        return debugLog(options, `Don't add file instance if original name and size are empty`)
      }

      result.files = buildFields(
        result.files,
        field,
        fileFactory(
          {
            buffer: complete(),
            name: filename,
            tempFilePath: getFilePath(),
            hash: getHash(),
            size,
            encoding,
            truncated: Boolean('truncated' in file && file.truncated),
            mimetype: mime,
          },
          options,
        ),
      )

      if (!request[waitFlushProperty]) {
        request[waitFlushProperty] = []
      }
      request[waitFlushProperty].push(writePromise)
    })

    file.on('error', (err) => {
      uploadTimer.clear()
      debugLog(options, `File Error: ${err.message}`)
      cleanup()
    })

    debugLog(options, `New upload started ${field}->${filename}, bytes:${getFileSize()}`)
    uploadTimer.set()
  })

  busboy.on('finish', () => {
    debugLog(options, `Busboy finished parsing request.`)
    if (options.parseNested) {
      result.fields = processNested(result.fields)
      result.files = processNested(result.files)
    }

    if (request[waitFlushProperty]) {
      Promise.all(request[waitFlushProperty]).then(() => {
        delete request[waitFlushProperty]
      })
    }
  })

  busboy.on('error', (err) => {
    debugLog(options, `Busboy error`)
    parsingRequest = false
    throw new APIError('Busboy error parsing multipart request', 500)
  })

  const reader = request.body.getReader()

  while (parsingRequest) {
    const { done, value } = await reader.read()

    if (done) {
      parsingRequest = false
    }

    busboy.write(value)
  }

  return result
}
