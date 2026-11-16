import type { BeforeReadHook } from '../../../collections/config/types.js'

/** Removes API key secrets before any collection read hooks can observe them. */
export const omitAPIKey: BeforeReadHook = ({ doc }) => {
  doc.hasAPIKey = Boolean(doc.apiKeyIndex)

  delete doc.apiKey
  delete doc.apiKeyIndex

  return doc
}
