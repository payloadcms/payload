import type { BeforeReadHook } from '../../../collections/config/types.js'

export const legacyAPIKeyLast4 = '•'.repeat(4)

/** Removes API key secrets before any collection read hooks can observe them. */
export const omitAPIKey: BeforeReadHook = ({ doc }) => {
  if (doc.apiKeyIndex && !doc.apiKeyLast4) {
    doc.apiKeyLast4 = legacyAPIKeyLast4
  }

  delete doc.apiKey
  delete doc.apiKeyIndex

  return doc
}
