import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import {
  _internal_renderFieldHandler,
  copyDataFromLocaleHandler,
  renderTabHandler,
} from '@payloadcms/ui/rsc'
import { buildFormStateHandler } from '@payloadcms/ui/utilities/buildFormState'
import { buildTableStateHandler } from '@payloadcms/ui/utilities/buildTableState'
import { initReq } from '@payloadcms/ui/utilities/initReq'
import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'
import {
  getDefaultLayoutHandler,
  renderWidgetHandler,
} from '@payloadcms/ui/views/Dashboard/serverFunctions'
import { renderDocumentHandler } from '@payloadcms/ui/views/Document/handleServerFunction'
import { renderDocumentSlotsHandler } from '@payloadcms/ui/views/Document/renderDocumentSlots'
import { renderListHandler } from '@payloadcms/ui/views/List/handleServerFunction'

import { slugifyHandler } from '@payloadcms/ui/utilities/slugify'

import { nextServerAdapter } from '../adapters/server.js'
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

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
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
    serverAdapter: nextServerAdapter,
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
