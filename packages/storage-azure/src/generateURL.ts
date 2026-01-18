import type { GenerateURL } from '@ruya.sa/plugin-cloud-storage/types'

import path from 'path'

interface Args {
  baseURL: string
  containerName: string
}

export const getGenerateURL =
  ({ baseURL, containerName }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return `${baseURL}/${containerName}/${path.posix.join(prefix, filename)}`
  }
