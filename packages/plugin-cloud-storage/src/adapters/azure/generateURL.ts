import path from 'path'

import type { GenerateURL } from '../../types.d.ts'

interface Args {
  baseURL: string
  containerName: string
}

export const getGenerateURL =
  ({ baseURL, containerName }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return `${baseURL}/${containerName}/${path.posix.join(prefix, filename)}`
  }
