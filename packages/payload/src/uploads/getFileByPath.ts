// @ts-strict-ignore
import { fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'
import path from 'path'

import type { PayloadRequest } from '../types/index.js'

const mimeTypeEstimate: Record<string, string> = {
  svg: 'image/svg+xml',
}

export const getFileByPath = async (filePath: string): Promise<PayloadRequest['file']> => {
  if (typeof filePath !== 'string') {
    return undefined
  }

  const name = path.basename(filePath)
  const ext = path.extname(filePath).slice(1)

  const [data, stat, type] = await Promise.all([
    fs.readFile(filePath),
    fs.stat(filePath),
    fileTypeFromFile(filePath),
  ])

  return {
    name,
    data,
    mimetype: type?.mime || mimeTypeEstimate[ext],
    size: stat.size,
  }
}
