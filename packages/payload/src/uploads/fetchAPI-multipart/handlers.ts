// @ts-strict-ignore
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
  cleanup: () => void
  complete: () => Buffer
  dataHandler: (data: Buffer) => void
  getFilePath: () => string
  getFileSize: () => number
  getHash: () => string
  getWritePromise: () => Promise<boolean>
}

export const tempFileHandler: Handler = (options, fieldname, filename) => {
  const dir = path.normalize(options.tempFileDir)
  const tempFilePath = path.join(process.cwd(), dir, getTempFilename())
  checkAndMakeDir({ createParentPath: true }, tempFilePath)

  debugLog(options, `Temporary file path is ${tempFilePath}`)

  const hash = crypto.createHash('md5')
  let fileSize = 0
  let completed = false

  debugLog(options, `Opening write stream for ${fieldname}->${filename}...`)
  const writeStream = fs.createWriteStream(tempFilePath)
  const writePromise = new Promise<boolean>((resolve, reject) => {
    writeStream.on('finish', () => resolve(true))
    writeStream.on('error', (err) => {
      debugLog(options, `Error write temp file: ${err}`)
      reject(err)
    })
  })

  return {
    cleanup: () => {
      completed = true
      debugLog(options, `Cleaning up temporary file ${tempFilePath}...`)
      writeStream.end()
      deleteFile(tempFilePath, (err) =>
        err
          ? debugLog(options, `Cleaning up temporary file ${tempFilePath} failed: ${err}`)
          : debugLog(options, `Cleaning up temporary file ${tempFilePath} done.`),
      )
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
      writeStream.write(data)
      hash.update(data)
      fileSize += data.length
      debugLog(options, `Uploading ${fieldname}->${filename}, bytes:${fileSize}...`)
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
    },
    complete: () => {
      debugLog(options, `Upload ${fieldname}->${filename} completed, bytes:${fileSize}.`)
      completed = true
      return getBuffer()
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
