import type { DefaultServerFunctionArgs, ServerFunction } from 'payload'

import { _internal_renderFieldHandler } from '../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js'
import { getDefaultLayoutHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/getDefaultLayoutServerFn.js'
import { renderWidgetHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/renderWidgetServerFn.js'
import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { buildFormStateHandler } from './buildFormState.js'
import { buildTableStateHandler } from './buildTableState.js'
import { copyDataFromLocaleHandler } from './copyDataFromLocale.js'
import { getFolderResultsComponentAndDataHandler } from './getFolderResultsComponentAndData.js'
import { schedulePublishHandler } from './schedulePublishHandler.js'
import { slugifyHandler } from './slugify.js'

export const baseServerFunctions: Record<string, ServerFunction> = {
  'copy-data-from-locale': copyDataFromLocaleHandler,
  'form-state': buildFormStateHandler,
  'get-default-layout': getDefaultLayoutHandler,
  'get-folder-results-component-and-data': getFolderResultsComponentAndDataHandler,
  'render-document': renderDocumentHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-list': renderListHandler,
  'render-widget': renderWidgetHandler,
  'schedule-publish': schedulePublishHandler,
  slugify: slugifyHandler,
  'table-state': buildTableStateHandler,
}

/**
 * Framework-agnostic server function dispatcher.
 * Adapters call this after running initReq to get the request context.
 */
export function dispatchServerFunction(args: {
  augmentedArgs: DefaultServerFunctionArgs
  extraServerFunctions?: Record<string, ServerFunction>
  name: string
}): Promise<unknown> | unknown {
  const { name, augmentedArgs, extraServerFunctions } = args
  const fn = extraServerFunctions?.[name] || baseServerFunctions[name]
  if (!fn) {
    throw new Error(`Unknown Server Function: ${name}`)
  }
  return fn(augmentedArgs)
}
