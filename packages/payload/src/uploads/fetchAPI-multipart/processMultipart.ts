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
import { buildFields, isFunc, parseFileName } from './utilities.js'

type ProcessMultipart = (args: {
  options: FetchAPIFileUploadOptions
  request: Request
}) => Promise<FetchAPIFileUploadResponse>

export const processMultipart: ProcessMultipart = async ({ options, request }) => {
  const result: FetchAPIFileUploadResponse = { fields: undefined!, files: undefined! }
  const headers: Record<string, string> = {}
  request.headers.forEach((value, name) => {
    headers[name] = value
  })
  const busboy = Busboy({ ...options, headers })
  const reader = request.body!.getReader()
  const uploads: { cleanup: () => Promise<void> | void; clear: () => void; file: Readable }[] = []
  const writes: Promise<boolean>[] = []
  let failure: Error | undefined
  let rejectFinished: (err: Error) => void
  let resolveFinished: () => void
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve
    rejectFinished = reject
  })

  const fail = (err: Error) => {
    if (failure) {
      return
    }
    failure = err
    rejectFinished(err)
    // Busboy may still be updating its current file after emitting a limit event.
    queueMicrotask(() => {
      for (const upload of uploads) {
        upload.clear()
        upload.file.destroy()
      }
      busboy.destroy()
      void reader.cancel(err).catch(() => {})
    })
  }
  const limitError = () =>
    new APIError('Multipart limit has been reached', httpStatus.REQUEST_ENTITY_TOO_LARGE)

  busboy.on('filesLimit', () => fail(limitError()))
  busboy.on('fieldsLimit', () => fail(limitError()))
  busboy.on('partsLimit', () => fail(limitError()))
  busboy.on('error', fail)
  busboy.on('field', (field, value, info) => {
    if (info.valueTruncated || info.nameTruncated) {
      fail(limitError())
    } else if (!failure) {
      result.fields = buildFields(result.fields, field, value)
    }
  })

  busboy.on('file', (field, file, info) => {
    if (failure) {
      file.resume()
      return
    }
    const { encoding, filename: name, mimeType: mime } = info
    const filename = parseFileName(options, name)
    const mimetype =
      (filename.endsWith('.glb') && 'model/gltf-binary') ||
      (filename.endsWith('.gltf') && 'model/gltf+json') ||
      mime
    const handler = options.useTempFiles
      ? tempFileHandler(options, field, filename)
      : memHandler(options, field, filename)
    const timer = createUploadTimer(options.uploadTimeout, () => {
      fail(new APIError(`Upload timeout for ${field}->${filename}, bytes:${handler.getFileSize()}`))
    })
    uploads.push({ cleanup: handler.cleanup, clear: timer.clear, file })
    // Observe write failures immediately, including failures before file end.
    const write = handler.getWritePromise()
    void write.catch(fail)
    writes.push(write)

    file.on('limit', () => {
      timer.clear()
      try {
        if (isFunc(options.limitHandler)) {
          options.limitHandler({ request, size: handler.getFileSize() })
        }
        if (options.abortOnLimit) {
          fail(
            new APIError(options.responseOnLimit!, httpStatus.REQUEST_ENTITY_TOO_LARGE, {
              size: handler.getFileSize(),
            }),
          )
        }
      } catch (err) {
        fail(err as Error)
      }
    })
    file.on('data', (data: Buffer) => {
      if (failure) {
        return
      }
      timer.set()
      const pending = handler.dataHandler(data)
      if (pending) {
        file.pause()
        void pending.then(() => {
          if (!failure) {
            file.resume()
          }
        }, fail)
      }
    })
    file.on('error', fail)
    file.on('end', () => {
      timer.clear()
      if (failure) {
        return
      }
      const size = handler.getFileSize()
      const buffer = handler.complete()
      if (!name && size === 0) {
        const cleanup = Promise.resolve(handler.cleanup()).then(() => true)
        void cleanup.catch(fail)
        writes.push(cleanup)
        return
      }
      result.files = buildFields(
        result.files,
        field,
        fileFactory(
          {
            name: filename,
            buffer,
            encoding,
            hash: handler.getHash(),
            mimetype,
            size,
            tempFilePath: handler.getFilePath(),
            truncated: Boolean(file.truncated),
          },
          options,
        ),
      )
    })
    timer.set()
  })
  busboy.on('finish', () => {
    void Promise.all(writes).then(() => resolveFinished(), fail)
  })

  // Waiting for each write callback bounds the parser queue and respects its backpressure.
  const pump = async () => {
    try {
      while (!failure) {
        const { done, value } = await reader.read()
        if (failure) {
          break
        }
        if (done) {
          busboy.end()
          break
        }
        await new Promise<void>((resolve, reject) => {
          busboy.write(value, (err?: Error | null) => (err ? reject(err) : resolve()))
        })
      }
    } finally {
      reader.releaseLock()
    }
  }
  void pump().catch(fail)

  try {
    await finished
    if (options.parseNested) {
      result.fields = processNested(result.fields)
      result.files = processNested(result.files)
    }
    return result
  } catch (err) {
    for (const upload of uploads) {
      upload.clear()
    }
    await Promise.all(uploads.map(async ({ cleanup }) => cleanup()))
    throw err
  }
}
