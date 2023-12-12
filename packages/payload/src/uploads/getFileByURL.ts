import path from 'path'

import type { File } from './types'

const getFileByURL = async (url: string): Promise<File> => {
  if (typeof url === 'string') {
    const res = await fetch(url)
    const blob = await res.blob()
    const arrayBuffer = await blob.arrayBuffer()

    const data = Buffer.from(arrayBuffer)
    const name = path.basename(url)

    return {
      name,
      data,
      mimetype: blob.type || undefined,
      size: blob.size || 0,
    }
  }
}

export default getFileByURL
