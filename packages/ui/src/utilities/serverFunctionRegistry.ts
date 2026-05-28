import type { ServerFunction } from 'payload'

import { buildFormStateHandler } from './buildFormState.js'
import { buildTableStateHandler } from './buildTableState.js'
import { copyDataFromLocaleHandler } from './copyDataFromLocale.js'
import { schedulePublishHandler } from './schedulePublishHandler.js'
import { renderDocumentHandler } from './sharedHandlers/renderDocument.js'
import { renderListHandler } from './sharedHandlers/renderList.js'

/**
 * Framework-agnostic server function handlers shared across all adapters.
 *
 * Each handler returns a value that may contain React elements (e.g.
 * `customComponents` inside form state, the `Document` / `List` nodes returned
 * by render-document / render-list). Adapters are expected to ship those over
 * the wire as RSC payloads — Next.js's runtime does this natively, while the
 * TanStack Start adapter pipes the result through `serializeForRsc` to convert
 * elements into `renderServerComponent` handles.
 */
export const sharedServerFunctions: Record<string, ServerFunction<any, any>> = {
  'copy-data-from-locale': copyDataFromLocaleHandler,
  'form-state': buildFormStateHandler,
  'render-document': renderDocumentHandler,
  'render-list': renderListHandler,
  'schedule-publish': schedulePublishHandler,
  'table-state': buildTableStateHandler,
}
