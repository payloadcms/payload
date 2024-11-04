import type { ServerFunction, ServerFunctionHandler } from 'payload'

import { buildFormStateHandler } from '@payloadcms/ui/utilities/buildFormState'
import { buildTableState } from '@payloadcms/ui/utilities/buildTableState'

import { initReq } from './initReq.js'
import { renderDocumentFn } from './renderDocument.js'
import { renderList } from './renderList.js'

const defaultFunctions = {
  'form-state': buildFormStateHandler as any as ServerFunction,
  'render-document': renderDocumentFn as any as ServerFunction,
  'render-list': renderList as any as ServerFunction,
  'table-state': buildTableState as any as ServerFunction,
}

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const { name: fnKey, args: fnArgs, config: configPromise, importMap } = args

  const { req } = await initReq(configPromise)

  const augmentedArgs: Parameters<ServerFunction>[0] = {
    ...fnArgs,
    importMap,
    req,
  }

  const serverFunctions: {
    [key: string]: ServerFunction
  } = {
    ...defaultFunctions,
    ...req.payload?.config?.admin?.serverFunctions?.reduce((acc, fnConfig) => {
      acc[fnConfig.name] = fnConfig.fn
      return acc
    }, {}),
  }

  const fn = serverFunctions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
