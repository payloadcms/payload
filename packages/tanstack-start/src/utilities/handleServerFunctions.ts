import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import { dataOnlyServerFunctions } from '@payloadcms/ui/utilities/dataOnlyServerFunctions'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'

import { RenderRSCComponent } from '../rsc/renderPayloadRSC.js'
import { initReq } from './initReq.server.js'
import { serializeForRsc } from './serializeForRsc.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  ...sharedServerFunctions,
  ...dataOnlyServerFunctions,
}

/**
 * Server function dispatcher for TanStack Start.
 *
 * Uses `RenderRSCComponent` (a re-export of `RenderServerComponent`) so
 * server components receive `serverProps` and client components receive
 * `clientProps`, mirroring the Next.js dispatcher in
 * `packages/next/src/utilities/handleServerFunctions.ts`.
 *
 * Pipes the result through `serializeForRsc`, which converts any React
 * elements left in the response (e.g. `state[path].customComponents.Field`
 * produced by `buildFormState`) into RSC "renderable handles" via
 * `renderServerComponent` from `@tanstack/react-start/rsc`. TanStack Start's
 * `$RSC` serialization adapter then ships those handles to the client as
 * Flight payloads — so this dispatcher must be invoked from a context that
 * uses TanStack's wire format (e.g. `createServerFn`), not raw
 * `JSON.stringify`.
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

  const result = await fn(augmentedArgs)

  return await serializeForRsc(result)
}
