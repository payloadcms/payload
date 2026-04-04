/**
 * Data-only server function handlers for non-RSC adapters (e.g. TanStack Start).
 *
 * These return JSON-serializable data instead of React nodes, so they can be
 * transported over regular HTTP/JSON rather than RSC flight payloads.
 *
 * Usage: an adapter merges these into its `handleServerFunctions` dispatch map
 * alongside `sharedServerFunctions`:
 *
 * ```ts
 * import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'
 * import { dataOnlyServerFunctions } from '@payloadcms/ui/utilities/dataOnlyServerFunctions'
 *
 * const serverFunctions = {
 *   ...sharedServerFunctions,
 *   ...dataOnlyServerFunctions,
 * }
 * ```
 */
import type { ServerFunction } from 'payload'

import { getDefaultLayoutDataOnlyHandler } from './dataOnlyHandlers/getDefaultLayout.js'
import { renderDocumentDataOnlyHandler } from './dataOnlyHandlers/renderDocument.js'
import { renderDocumentSlotsDataOnlyHandler } from './dataOnlyHandlers/renderDocumentSlots.js'
import { renderFieldDataOnlyHandler } from './dataOnlyHandlers/renderField.js'
import { renderListDataOnlyHandler } from './dataOnlyHandlers/renderList.js'
import { renderWidgetDataOnlyHandler } from './dataOnlyHandlers/renderWidget.js'

export { getDefaultLayoutDataOnlyHandler } from './dataOnlyHandlers/getDefaultLayout.js'
export type { GetDefaultLayoutDataOnlyResult } from './dataOnlyHandlers/getDefaultLayout.js'
export { renderDocumentDataOnlyHandler } from './dataOnlyHandlers/renderDocument.js'
export type { RenderDocumentDataOnlyResult } from './dataOnlyHandlers/renderDocument.js'
export { renderDocumentSlotsDataOnlyHandler } from './dataOnlyHandlers/renderDocumentSlots.js'
export type {
  DocumentSlotConfigs,
  RenderDocumentSlotsDataOnlyResult,
} from './dataOnlyHandlers/renderDocumentSlots.js'

export { renderFieldDataOnlyHandler } from './dataOnlyHandlers/renderField.js'
export type { RenderFieldDataOnlyResult } from './dataOnlyHandlers/renderField.js'
export { renderListDataOnlyHandler } from './dataOnlyHandlers/renderList.js'
export type { RenderListDataOnlyResult } from './dataOnlyHandlers/renderList.js'
export { renderWidgetDataOnlyHandler } from './dataOnlyHandlers/renderWidget.js'
export type { RenderWidgetDataOnlyResult } from './dataOnlyHandlers/renderWidget.js'

/**
 * Complete set of data-only server function handlers.
 * Non-RSC adapters should merge this with `sharedServerFunctions` to replace
 * the RSC-specific handlers (`render-document`, `render-list`, etc.).
 */
export const dataOnlyServerFunctions: Record<string, ServerFunction<any, any>> = {
  'get-default-layout': getDefaultLayoutDataOnlyHandler,
  'render-document': renderDocumentDataOnlyHandler,
  'render-document-slots': renderDocumentSlotsDataOnlyHandler,
  'render-field': renderFieldDataOnlyHandler,
  'render-list': renderListDataOnlyHandler,
  'render-widget': renderWidgetDataOnlyHandler,
}
