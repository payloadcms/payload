import type {
  DefaultServerFunctionArgs,
  ServerAdapter,
  ServerFunction,
  ServerFunctionHandler,
} from 'payload'

import { renderTabHandler } from '../elements/Nav/SidebarTabs/renderTabServerFn.js'
import { _internal_renderFieldHandler } from '../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js'
import { getDefaultLayoutHandler, renderWidgetHandler } from '../views/Dashboard/serverFunctions.js'
import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { buildFormStateHandler } from './buildFormState.js'
import { buildTableStateHandler } from './buildTableState.js'
import { copyDataFromLocaleHandler } from './copyDataFromLocale.js'
import { initReq } from './initReq.js'
import { schedulePublishHandler } from './schedulePublishHandler.js'
import { slugifyHandler } from './slugify.js'
import { switchLanguageHandler } from './switchLanguageHandler.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
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

/**
 * Factory for the framework-agnostic `handleServerFunctions` entry point. The
 * caller (a framework adapter, e.g. `@payloadcms/next`) supplies the
 * `ServerAdapter` once, and the returned handler can be wired directly into
 * the framework's server-action dispatcher.
 */
export const createServerFunctionHandler = ({
  serverAdapter,
}: {
  serverAdapter: ServerAdapter
}): ServerFunctionHandler => {
  return async (args) => {
    const {
      name: fnKey,
      args: fnArgs,
      config: configPromise,
      importMap,
      serverFunctions: extraServerFunctions,
    } = args

    const { cookies, locale, permissions, req } = await initReq({
      configPromise,
      importMap,
      key: 'RootLayout',
      serverAdapter,
    })

    const augmentedArgs: DefaultServerFunctionArgs = {
      ...fnArgs,
      cookies,
      importMap,
      locale,
      permissions,
      req,
    }

    const fn = extraServerFunctions?.[fnKey] || baseServerFunctions[fnKey]

    if (!fn) {
      throw new Error(`Unknown Server Function: ${fnKey}`)
    }

    return fn(augmentedArgs)
  }
}
