import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

import { getKeyFromFilename } from './utilities.js'

export const generateURL: GenerateURL = ({ data, filename, prefix = '' }) => {
  const key = getKeyFromFilename(data, filename)
  return `https://utfs.io/f/${path.posix.join(prefix, key || '')}`
}
