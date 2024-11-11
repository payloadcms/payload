import type { ServerFunction, ServerFunctionHandler } from 'payload'

import { buildFormStateHandler } from '@payloadcms/ui/utilities/buildFormState'
import { buildTableStateHandler } from '@payloadcms/ui/utilities/buildTableState'

import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { initReq } from './initReq.js'

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const { name: fnKey, args: fnArgs, config: configPromise, importMap } = args

  const { req } = await initReq(configPromise)

  const augmentedArgs: Parameters<ServerFunction>[0] = {
    ...fnArgs,
    importMap,
    req,
  }

  const serverFunctions = {
    'form-state': buildFormStateHandler as any as ServerFunction,
    'render-document': renderDocumentHandler as any as ServerFunction,
    'render-document-slots': renderDocumentSlotsHandler as any as ServerFunction,
    'render-list': renderListHandler as any as ServerFunction,
    'table-state': buildTableStateHandler as any as ServerFunction,
  }

  const fn = serverFunctions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
