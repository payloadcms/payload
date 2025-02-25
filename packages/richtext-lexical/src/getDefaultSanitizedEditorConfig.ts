import type { SanitizedConfig } from 'payload'

import { type SanitizedServerEditorConfig } from './index.js'
import { defaultEditorConfig } from './lexical/config/server/default.js'
import { sanitizeServerEditorConfig } from './lexical/config/server/sanitize.js'

let cachedDefaultSanitizedServerEditorConfig:
  | null
  | Promise<SanitizedServerEditorConfig>
  | SanitizedServerEditorConfig = (global as any)
  ._payload_lexical_defaultSanitizedServerEditorConfig

if (!cachedDefaultSanitizedServerEditorConfig) {
  cachedDefaultSanitizedServerEditorConfig = (
    global as any
  )._payload_lexical_defaultSanitizedServerEditorConfig = null
}

export const getDefaultSanitizedEditorConfig = async (args: {
  config: SanitizedConfig
  parentIsLocalized: boolean
}): Promise<SanitizedServerEditorConfig> => {
  const { config, parentIsLocalized } = args

  if (cachedDefaultSanitizedServerEditorConfig) {
    return await cachedDefaultSanitizedServerEditorConfig
  }

  cachedDefaultSanitizedServerEditorConfig = sanitizeServerEditorConfig(
    defaultEditorConfig,
    config,
    parentIsLocalized,
  )
  ;(global as any).payload_lexical_defaultSanitizedServerEditorConfig =
    cachedDefaultSanitizedServerEditorConfig

  cachedDefaultSanitizedServerEditorConfig = await cachedDefaultSanitizedServerEditorConfig
  ;(global as any).payload_lexical_defaultSanitizedServerEditorConfig =
    cachedDefaultSanitizedServerEditorConfig

  return cachedDefaultSanitizedServerEditorConfig
}
