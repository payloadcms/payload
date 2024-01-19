import { fromFile } from 'file-type'
import fs from 'fs'
import path from 'path'

import type { CustomPayloadRequest } from '../exports/types'

const mimeTypeEstimate = {
  svg: 'image/svg+xml',
}

const getFileByPath = async (filePath: string): Promise<CustomPayloadRequest['file']> => {
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

export default getFileByPath
