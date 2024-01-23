import { NextFileUploadOptions } from '.'

import fs, { WriteStream } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { debugLog, checkAndMakeDir, getTempFilename, deleteFile } from './utilities'

type Handler = (
  options: NextFileUploadOptions,
  fieldname: string,
  filename: string,
) => {
  dataHandler: (data: Buffer) => void
  getFilePath: () => string
  getFileSize: () => number
  getHash: () => string
  complete: () => Buffer
  cleanup: () => void
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
    complete: () => {
      completed = true
      debugLog(options, `Upload ${fieldname}->${filename} completed, bytes:${fileSize}.`)
      if (writeStream instanceof WriteStream) writeStream.end()
      // Return empty buff since data was uploaded into a temp file.
      return Buffer.concat([])
    },
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
    getWritePromise: () => writePromise,
  }
}

export const memHandler: Handler = (options, fieldname, filename) => {
  const buffers = []
  const hash = crypto.createHash('md5')
  let fileSize = 0
  let completed = false

  const getBuffer = () => Buffer.concat(buffers, fileSize)

  return {
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
    complete: () => {
      debugLog(options, `Upload ${fieldname}->${filename} completed, bytes:${fileSize}.`)
      completed = true
      return getBuffer()
    },
    cleanup: () => {
      completed = true
    },
    getWritePromise: () => Promise.resolve(true),
  }
}
