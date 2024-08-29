import path from 'path'

import type { GenerateURL } from '../../types.js'

type GenerateUrlArgs = {
  baseUrl: string
  prefix?: string
}

export const getGenerateUrl = ({ baseUrl }: GenerateUrlArgs): GenerateURL => {
  return ({ filename, prefix = '' }) => {
    return `${baseUrl}/${path.posix.join(prefix, filename)}`
  }
}
