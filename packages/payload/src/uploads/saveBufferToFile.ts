// @ts-strict-ignore
import fs from 'fs'
import { Readable } from 'stream'

/**
 * Save buffer data to a file.
 * @param {Buffer} buffer - buffer to save to a file.
 * @param {string} filePath - path to a file.
 */
const saveBufferToFile = async (buffer: Buffer, filePath: string): Promise<void> => {
  // Setup readable stream from buffer.
  let streamData = buffer
  const readStream = new Readable()
  readStream._read = () => {
    readStream.push(streamData)
    streamData = null
  }
  // Setup file system writable stream.
  return fs.writeFileSync(filePath, buffer)
}

export default saveBufferToFile
