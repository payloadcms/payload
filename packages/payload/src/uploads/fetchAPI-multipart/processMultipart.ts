// @ts-strict-ignore
import type { Readable } from 'stream'

import Busboy from 'busboy'
import { status as httpStatus } from 'http-status'

import type { FetchAPIFileUploadOptions } from '../../config/types.js'
import type { FetchAPIFileUploadResponse } from './index.js'

import { APIError } from '../../errors/APIError.js'
import { fileFactory } from './fileFactory.js'
import { memHandler, tempFileHandler } from './handlers.js'
import { processNested } from './processNested.js'
import { createUploadTimer } from './uploadTimer.js'
import { buildFields, debugLog, isFunc, parseFileName } from './utilities.js'

const waitFlushProperty = Symbol('wait flush property symbol')

type ProcessMultipart = (args: {
  options: FetchAPIFileUploadOptions
  request: Request
}) => Promise<FetchAPIFileUploadResponse>
export const processMultipart: ProcessMultipart = async ({ options, request }) => {
  let parsingRequest = true

  let shouldAbortProccessing = false
  let fileCount = 0
  let filesCompleted = 0
  let allFilesHaveResolved: (value?: unknown) => void
  let failedResolvingFiles: (err: Error) => void

  const allFilesComplete = new Promise((res, rej) => {
    allFilesHaveResolved = res
    failedResolvingFiles = rej
  })

  const result: FetchAPIFileUploadResponse = {
    fields: undefined,
    files: undefined,
  }

  const headersObject = {}
  request.headers.forEach((value, name) => {
    headersObject[name] = value
  })

  const reader = request.body.getReader()

  const busboy = Busboy({ ...options, headers: headersObject })

  function abortAndDestroyFile(file: Readable, err: APIError) {
    file.destroy()
    shouldAbortProccessing = true
    failedResolvingFiles(err)
  }

  // Build multipart req.body fields
  busboy.on('field', (field, val) => {
    result.fields = buildFields(result.fields, field, val)
  })

  // Build req.files fields
  busboy.on('file', (field, file, info) => {
    fileCount += 1
    // Parse file name(cutting huge names, decoding, etc..).
    const { encoding, filename: name, mimeType: mime } = info
    const filename = parseFileName(options, name)

    // Define methods and handlers for upload process.
    const { cleanup, complete, dataHandler, getFilePath, getFileSize, getHash, getWritePromise } =
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
      return abortAndDestroyFile(
        file,
        new APIError(`Upload timeout for ${field}->${filename}, bytes:${getFileSize()}`),
      )
    })

    file.on('limit', () => {
      debugLog(options, `Size limit reached for ${field}->${filename}, bytes:${getFileSize()}`)
      uploadTimer.clear()

      if (isFunc(options.limitHandler)) {
        options.limitHandler({ request, size: getFileSize() })
      }

      // Return error and cleanup files if abortOnLimit set.
      if (options.abortOnLimit) {
        debugLog(options, `Upload file size limit reached ${field}->${filename}.`)
        cleanup()
        abortAndDestroyFile(
          file,
          new APIError(options.responseOnLimit, httpStatus.REQUEST_ENTITY_TOO_LARGE, {
            size: getFileSize(),
          }),
        )
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
        fileCount -= 1
        if (options.useTempFiles) {
          cleanup()
          debugLog(options, `Removing the empty file ${field}->${filename}`)
        }
        return debugLog(options, `Don't add file instance if original name and size are empty`)
      }

      filesCompleted += 1

      result.files = buildFields(
        result.files,
        field,
        fileFactory(
          {
            name: filename,
            buffer: complete(),
            encoding,
            hash: getHash(),
            mimetype: mime,
            size,
            tempFilePath: getFilePath(),
            truncated: Boolean('truncated' in file && file.truncated) || false,
          },
          options,
        ),
      )

      if (!request[waitFlushProperty]) {
        request[waitFlushProperty] = []
      }
      request[waitFlushProperty].push(writePromise)

      if (filesCompleted === fileCount) {
        allFilesHaveResolved()
      }
    })

    file.on('error', (err) => {
      uploadTimer.clear()
      debugLog(options, `File Error: ${err.message}`)
      cleanup()
      failedResolvingFiles(err)
    })

    // Start upload process.
    debugLog(options, `New upload started ${field}->${filename}, bytes:${getFileSize()}`)
    uploadTimer.set()
  })

  busboy.on('finish', async () => {
    debugLog(options, `Busboy finished parsing request.`)
    if (options.parseNested) {
      result.fields = processNested(result.fields)
      result.files = processNested(result.files)
    }

    if (request[waitFlushProperty]) {
      try {
        await Promise.all(request[waitFlushProperty]).then(() => {
          delete request[waitFlushProperty]
        })
      } catch (err) {
        debugLog(options, `Error waiting for file write promises: ${err}`)
      }
    }

    return result
  })

  busboy.on(
    'error',
    (err = new APIError('Busboy error parsing multipart request', httpStatus.BAD_REQUEST)) => {
      debugLog(options, `Busboy error`)
      throw err
    },
  )

  while (parsingRequest) {
    const { done, value } = await reader.read()

    if (done) {
      parsingRequest = false
    }

    if (value && !shouldAbortProccessing) {
      busboy.write(value)
    }
  }

  if (fileCount !== 0) {
    await allFilesComplete.catch((e) => {
      throw e
    })
  }

  return result
}
