// @ts-strict-ignore
import { fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'
import path from 'path'

import type { PayloadRequest } from '../types/index.js'

const mimeTypeEstimate = {
  svg: 'image/svg+xml',
}

export const getFileByPath = async (filePath: string): Promise<PayloadRequest['file']> => {
  if (typeof filePath === 'string') {
    const data = await fs.readFile(filePath)
    const mimetype = fileTypeFromFile(filePath)
    const { size } = await fs.stat(filePath)

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
