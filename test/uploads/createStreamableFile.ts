import { File } from 'buffer'
import NodeFormData from 'form-data'
import fs from 'fs'
import { open } from 'node:fs/promises'
import { basename } from 'node:path'

import { getMimeType } from './getMimeType.js'

export async function createStreamableFile(
  path: string,
): Promise<{ file: File; handle: fs.promises.FileHandle }> {
  const name = basename(path)
  const handle = await open(path)

  const { type } = getMimeType(path)

  const file = new File([], name, { type })
  file.stream = () => handle.readableWebStream()

  const formDataNode = new NodeFormData()
  formDataNode.append('file', fs.createReadStream(path))

  const contentLength = await new Promise((resolve, reject) => {
    formDataNode.getLength((err, length) => {
      if (err) {
        reject(err)
      } else {
        resolve(length)
      }
    })
  })

  // Set correct size otherwise, fetch will encounter UND_ERR_REQ_CONTENT_LENGTH_MISMATCH
  Object.defineProperty(file, 'size', { get: () => contentLength })

  return { file, handle }
}
