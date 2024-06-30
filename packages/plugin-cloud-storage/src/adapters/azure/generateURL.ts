import path from 'path'

import type { GenerateURL } from '../../types'

interface Args {
  baseURL: string
  containerName: string
}

export const getGenerateURL =
  ({ baseURL, containerName }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return `${baseURL}/${containerName}/${path.posix.join(prefix, encodeURIComponent(filename))}`
  }
