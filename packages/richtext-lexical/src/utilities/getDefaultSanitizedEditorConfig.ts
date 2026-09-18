import type { SanitizedConfig } from 'payload'

import { type SanitizedServerEditorConfig } from '../index.js'
import { defaultEditorConfig } from '../lexical/config/server/default.js'
import { sanitizeServerEditorConfig } from '../lexical/config/server/sanitize.js'

const lexicalGlobal = globalThis as {
  _payload_lexical_defaultSanitizedServerEditorConfig?: SanitizedServerEditorConfig
} & typeof globalThis

export const getDefaultSanitizedEditorConfig = ({
  config,
  parentIsLocalized,
}: {
  config: SanitizedConfig
  parentIsLocalized: boolean
}): SanitizedServerEditorConfig => {
  return (lexicalGlobal._payload_lexical_defaultSanitizedServerEditorConfig ??=
    sanitizeServerEditorConfig(defaultEditorConfig, config, parentIsLocalized))
}
