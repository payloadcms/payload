import type { SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { JsonObject } from '../types/index.js'

import { mergeLocalizedData } from '../utilities/mergeLocalizedData.js'

/** Split an authorized latest/all write between its locale-specific starting copies. */
export function buildLocalizedVersionWrite({
  config,
  currentDoc,
  fields,
  result,
  targetsByLocale,
}: {
  config: SanitizedConfig
  currentDoc: JsonObject | null
  fields: Field[]
  result: JsonObject
  targetsByLocale: Record<string, 'draft' | 'published'>
}): { hasDraftLocales: boolean; mainData: JsonObject | null; versionData: JsonObject } {
  const statuses = result._status as Record<string, unknown>
  const hasDraftLocales = Object.values(statuses).includes('draft')
  const liveLocales = Object.keys(targetsByLocale).filter(
    (code) => targetsByLocale[code] === 'published' || statuses[code] === 'published',
  )

  if (liveLocales.length === 0) {
    return { hasDraftLocales, mainData: null, versionData: result }
  }

  const mainData = mergeLocalizedData({
    configBlockReferences: config.blocks,
    dataWithLocales: result,
    docWithLocales: currentDoc ?? {},
    fields,
    localesToUpdate: liveLocales,
    preserveNonLocalized: hasDraftLocales,
  })

  mainData._status = { ...currentDoc?._status }
  for (const code of liveLocales) {
    mainData._status[code] = statuses[code]
  }

  return { hasDraftLocales, mainData, versionData: result }
}
