import fileType from 'file-type'
import fs from 'fs'
import path from 'path'
const { fromFile } = fileType

import type { PayloadRequestWithData } from '../types/index.js'

const mimeTypeEstimate = {
  svg: 'image/svg+xml',
}

export const getFileByPath = async (filePath: string): Promise<PayloadRequestWithData['file']> => {
  if (typeof filePath === 'string') {
    const data = fs.readFileSync(filePath)
    const mimetype = fromFile(filePath)
    const { size } = fs.statSync(filePath)

    const name = path.basename(filePath)
    const ext = path.extname(filePath).slice(1)

    const mime = (await mimetype)?.mime || mimeTypeEstimate[ext]

    return {
      name,
      data,
      mimetype: mime,
      size,
    }
  }

  return undefined
}
