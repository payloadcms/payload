import type { ServerFunction, ServerFunctionHandler } from 'payload'

import { copyDataFromLocaleHandler } from '@payloadcms/ui/rsc'
import { buildFormStateHandler } from '@payloadcms/ui/utilities/buildFormState'
import { buildTableStateHandler } from '@payloadcms/ui/utilities/buildTableState'
import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'

import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { initReq } from './initReq.js'

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const { name: fnKey, args: fnArgs, config: configPromise, importMap } = args

  const { req } = await initReq({
    configPromise,
    importMap,
    key: 'RootLayout',
  })

  const augmentedArgs: Parameters<ServerFunction>[0] = {
    ...fnArgs,
    importMap,
    req,
  }

  const serverFunctions = {
    'copy-data-from-locale': copyDataFromLocaleHandler as any as ServerFunction,
    'form-state': buildFormStateHandler as any as ServerFunction,
    'render-document': renderDocumentHandler as any as ServerFunction,
    'render-document-slots': renderDocumentSlotsHandler as any as ServerFunction,
    'render-list': renderListHandler as any as ServerFunction,
    'schedule-publish': schedulePublishHandler as any as ServerFunction,
    'table-state': buildTableStateHandler as any as ServerFunction,
  }

  const fn = serverFunctions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
