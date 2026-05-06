import type { ServerFunction } from 'payload'

import { buildFormStateHandler } from './buildFormState.js'
import { buildTableStateHandler } from './buildTableState.js'
import { copyDataFromLocaleHandler } from './copyDataFromLocale.js'
import { schedulePublishHandler } from './schedulePublishHandler.js'

/**
 * Framework-agnostic server function handlers that can be shared across all adapters.
 * RSC-specific handlers (render-document, render-list, etc.) are provided by
 * the framework adapter and merged at dispatch time.
 */
export const sharedServerFunctions: Record<string, ServerFunction<any, any>> = {
  'copy-data-from-locale': copyDataFromLocaleHandler,
  'form-state': buildFormStateHandler,
  'schedule-publish': schedulePublishHandler,
  'table-state': buildTableStateHandler,
}
