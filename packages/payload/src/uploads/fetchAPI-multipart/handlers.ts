import crypto from 'crypto'
import fs, { WriteStream } from 'fs'
import path from 'path'

import type { FetchAPIFileUploadOptions } from '../../config/types.js'

import { checkAndMakeDir, debugLog, deleteFile, getTempFilename } from './utilities.js'

type Handler = (
  options: FetchAPIFileUploadOptions,
  fieldname: string,
  filename: string,
) => {
  cleanup: () => Promise<void> | void
  complete: () => Buffer
  dataHandler: (data: Buffer) => Promise<void> | void
  getFilePath: () => string
  getFileSize: () => number
  getHash: () => string
  getWritePromise: () => Promise<boolean>
}

export const tempFileHandler: Handler = (options, fieldname, filename) => {
  const tempFilePath = path.resolve(options.tempFileDir!, getTempFilename())
  checkAndMakeDir({ createParentPath: true }, tempFilePath)

  debugLog(options, `Temporary file path is ${tempFilePath}`)

  const hash = crypto.createHash('md5')
  let fileSize = 0
  let completed = false

  debugLog(options, `Opening write stream for ${fieldname}->${filename}...`)
  const writeStream = fs.createWriteStream(tempFilePath)
  const writePromise = new Promise<boolean>((resolve, reject) => {
    writeStream.on('finish', () => resolve(true))
    writeStream.on('close', () => resolve(false))
    writeStream.on('error', (err) => {
      debugLog(options, `Error write temp file: ${err}`)
      reject(err)
    })
  })

  return {
    cleanup: () => {
      completed = true
      return new Promise<void>((resolve) => {
        const remove = () => deleteFile(tempFilePath, () => resolve())
        if (writeStream.closed) {
          remove()
        } else {
          writeStream.once('close', remove)
          writeStream.destroy()
        }
      })
    },
    complete: () => {
      completed = true
      debugLog(options, `Upload ${fieldname}->${filename} completed, bytes:${fileSize}.`)
      if (writeStream instanceof WriteStream) {
        writeStream.end()
      }
      // Return empty buff since data was uploaded into a temp file.
      return Buffer.concat([])
    },
    dataHandler: (data) => {
      if (completed === true) {
        debugLog(options, `Error: got ${fieldname}->${filename} data chunk for completed upload!`)
        return
      }
      const ready = writeStream.write(data)
      hash.update(data)
      fileSize += data.length
      debugLog(options, `Uploading ${fieldname}->${filename}, bytes:${fileSize}...`)
      if (!ready) {
        return new Promise<void>((resolve) => writeStream.once('drain', resolve))
      }
    },
    getFilePath: () => tempFilePath,
    getFileSize: () => fileSize,
    getHash: () => hash.digest('hex'),
    getWritePromise: () => writePromise,
  }
}

export const memHandler: Handler = (options, fieldname, filename) => {
  const buffers: Buffer[] = []
  const hash = crypto.createHash('md5')
  let fileSize = 0
  let completed = false

  const getBuffer = () => Buffer.concat(buffers, fileSize)

  return {
    cleanup: () => {
      completed = true
      buffers.length = 0
    },
    complete: () => {
      debugLog(options, `Upload ${fieldname}->${filename} completed, bytes:${fileSize}.`)
      completed = true
      const buffer = getBuffer()
      buffers.length = 0
      return buffer
    },
    dataHandler: (data) => {
      if (completed === true) {
        debugLog(options, `Error: got ${fieldname}->${filename} data chunk for completed upload!`)
        return
      }
      buffers.push(data)
      hash.update(data)
      fileSize += data.length
      debugLog(options, `Uploading ${fieldname}->${filename}, bytes:${fileSize}...`)
    },
    getFilePath: () => '',
    getFileSize: () => fileSize,
    getHash: () => hash.digest('hex'),
    getWritePromise: () => Promise.resolve(true),
  }
}
