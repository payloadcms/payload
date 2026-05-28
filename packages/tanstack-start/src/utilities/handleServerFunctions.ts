import type { DefaultServerFunctionArgs, ServerFunction, ServerFunctionHandler } from 'payload'

import { renderTabHandler } from '@payloadcms/ui/elements/Nav/SidebarTabs/renderTabServerFn'
import { _internal_renderFieldHandler } from '@payloadcms/ui/rsc'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'
import { getDefaultLayoutHandler } from '@payloadcms/ui/views/Dashboard/Default/ModularDashboard/renderWidget/getDefaultLayoutServerFn'
import { renderWidgetHandler } from '@payloadcms/ui/views/Dashboard/Default/ModularDashboard/renderWidget/renderWidgetServerFn'
import { renderDocumentSlotsHandler } from '@payloadcms/ui/views/Document/renderDocumentSlots'

import { RenderRSCComponent } from '../rsc/renderPayloadRSC.js'
import { initReq } from './initReq.server.js'
import { serializeForRsc } from './serializeForRsc.js'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  ...sharedServerFunctions,
  'get-default-layout': getDefaultLayoutHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-tab': renderTabHandler,
  'render-widget': renderWidgetHandler,
}

/**
 * Server function dispatcher for TanStack Start.
 *
 * Mirrors `packages/next/src/utilities/handleServerFunctions.ts` and uses the
 * exact same set of handlers — both adapters share `sharedServerFunctions`
 * plus the small set of RSC-only handlers re-exported by `@payloadcms/ui`.
 *
 * Pipes the result through `serializeForRsc`, which converts any React
 * elements left in the response (e.g. `state[path].customComponents.Field`
 * produced by `buildFormState`, the `List` / `Document` nodes returned by
 * `render-list` / `render-document`) into RSC "renderable handles" via
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
