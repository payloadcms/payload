import type { ServerFunction } from 'payload'

import { renderTabHandler } from '../elements/Nav/SidebarTabs/renderTabServerFn.js'
import { _internal_renderFieldHandler } from '../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js'
import { getDefaultLayoutHandler, renderWidgetHandler } from '../views/Dashboard/serverFunctions.js'
import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { buildFormStateHandler } from './buildFormState.js'
import { buildTableStateHandler } from './buildTableState.js'
import { copyDataFromLocaleHandler } from './copyDataFromLocale.js'
import { schedulePublishHandler } from './schedulePublishHandler.js'
import { slugifyHandler } from './slugify.js'
import { switchLanguageHandler } from './switchLanguageHandler.js'

/**
 * The complete, framework-agnostic set of Payload server functions.
 *
 * Every adapter (`@payloadcms/next`, `@payloadcms/tanstack-start`) dispatches
 * from this single registry via `createServerFunctionHandler`, so a handler
 * added here reaches every framework and the adapter lists can't drift.
 *
 * Handlers may return values containing React elements (e.g. `customComponents`
 * inside form state, the `Document` / `List` nodes from render-document /
 * render-list, the render-field / render-widget output). Adapters ship those
 * over the wire as RSC payloads: Next.js does this natively, while the TanStack
 * Start adapter passes a `transformResult` (`serializeForRsc`) to
 * `createServerFunctionHandler` that converts elements into
 * `renderServerComponent` handles.
 */
export const sharedServerFunctions: Record<string, ServerFunction<any, any>> = {
  'copy-data-from-locale': copyDataFromLocaleHandler,
  'form-state': buildFormStateHandler,
  'get-default-layout': getDefaultLayoutHandler,
  'render-document': renderDocumentHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-list': renderListHandler,
  'render-tab': renderTabHandler,
  'render-widget': renderWidgetHandler,
  'schedule-publish': schedulePublishHandler,
  slugify: slugifyHandler,
  'switch-language': switchLanguageHandler,
  'table-state': buildTableStateHandler,
}
