import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import { _internal_renderFieldHandler, copyDataFromLocaleHandler } from '@payloadcms/ui/rsc'
import { buildTableStateHandler } from '@payloadcms/ui/utilities/buildTableState'
import { getFolderResultsComponentAndDataHandler } from '@payloadcms/ui/utilities/getFolderResultsComponentAndData'
import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'

import { getDefaultLayoutHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/getDefaultLayoutServerFn.js'
import { renderWidgetHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/renderWidgetServerFn.js'
import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { setAdminConfig } from './adminConfigCache.js'
import { initReq } from './initReq.js'
import { renderAdminRscHandler } from './renderAdminRsc.js'
import { slugifyHandler } from './slugify.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  'copy-data-from-locale': copyDataFromLocaleHandler,
  'get-default-layout': getDefaultLayoutHandler,
  'get-folder-results-component-and-data': getFolderResultsComponentAndDataHandler,
  'render-admin-rsc': renderAdminRscHandler,
  'render-document': renderDocumentHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-list': renderListHandler,
  'render-widget': renderWidgetHandler,
  'schedule-publish': schedulePublishHandler,
  slugify: slugifyHandler,
  'table-state': buildTableStateHandler,
}

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const {
    name: fnKey,
    adminConfig,
    args: fnArgs,
    config: configPromise,
    serverFunctions: extraServerFunctions,
  } = args

  if (adminConfig) {
    setAdminConfig(adminConfig)
  }

  const { cookies, locale, permissions, req } = await initReq({
    configPromise,
    key: 'RootLayout',
  })

  const augmentedArgs: DefaultServerFunctionArgs = {
    ...fnArgs,
    adminConfig,
    cookies,
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
