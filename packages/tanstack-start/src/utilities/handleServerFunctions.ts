import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import { dataOnlyServerFunctions } from '@payloadcms/ui/utilities/dataOnlyServerFunctions'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'

import { RenderRSCComponent } from '../rsc/renderPayloadRSC.js'
import { initReq } from './initReq.server.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  ...sharedServerFunctions,
  ...dataOnlyServerFunctions,
}

/**
 * Server function dispatcher for TanStack Start.
 *
 * Uses `RenderRSCComponent` which passes `serverProps` to server components
 * and `clientProps` only to client components.
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
    mode: 'rsc',
    permissions,
    renderComponent: RenderRSCComponent,
    req,
  }

  const fn = extraServerFunctions?.[fnKey] || baseServerFunctions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  return fn(augmentedArgs)
}
