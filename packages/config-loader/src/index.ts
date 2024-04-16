import type { SanitizedConfig } from 'payload/types'

import { findConfig } from './find.js'

export const loadConfig = async (): Promise<SanitizedConfig> => {
  const configPath = findConfig()
  const configPromise = await import(configPath)
  return configPromise?.default || configPromise
}
