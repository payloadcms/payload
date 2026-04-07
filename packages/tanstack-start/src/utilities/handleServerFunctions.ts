import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'
import { dataOnlyServerFunctions } from '@payloadcms/ui/utilities/dataOnlyServerFunctions'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'

import { initReq } from './initReq.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  ...sharedServerFunctions,
  ...dataOnlyServerFunctions,
}

/**
 * Server function dispatcher for TanStack Start.
 * Merges shared + data-only handlers (no RSC flight payloads), initializes
 * a Payload request, and delegates to the matching handler.
 */
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
  })

  const augmentedArgs: DefaultServerFunctionArgs = {
    ...fnArgs,
    cookies,
    importMap,
    locale,
    mode: 'data-only',
    permissions,
    renderComponent: RenderClientComponent,
    req,
  }

  const fn = extraServerFunctions?.[fnKey] || baseServerFunctions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
