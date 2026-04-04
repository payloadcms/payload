import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import { _internal_renderFieldHandler } from '@payloadcms/ui/rsc'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'

import { getDefaultLayoutHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/getDefaultLayoutServerFn.js'
import { renderWidgetHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/renderWidgetServerFn.js'
import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { initReq } from './initReq.js'
import { slugifyHandler } from './slugify.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  ...sharedServerFunctions,
  'get-default-layout': getDefaultLayoutHandler,
  'render-document': renderDocumentHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-list': renderListHandler,
  'render-widget': renderWidgetHandler,
  slugify: slugifyHandler,
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
