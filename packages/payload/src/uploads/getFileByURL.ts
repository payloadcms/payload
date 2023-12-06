import fetch from 'node-fetch'
import path from 'path'

import type { File } from './types'

const getFileByURL = async (url: string): Promise<File> => {
  if (typeof url === 'string') {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })
    const data = await res.buffer()
    const name = path.basename(url)

    return {
      name,
      data,
      mimetype: res.headers.get('content-type') || undefined,
      size: Number(res.headers.get('content-length')) || 0,
    }
  }
}

export default getFileByURL
