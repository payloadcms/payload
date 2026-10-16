'use server'

import type { ServerFunctionClientArgs } from 'payload'

import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'

import { serverFunctionContext } from './context.js'

const handleServerFunctions = createServerFunctionHandler({
  initAdminContext: ({ configPromise, importMap }) =>
    serverFunctionContext
      .getStore()!
      .initAdminContext({ configPromise, importMap, key: 'RootLayout' }),
})

/**
 * The single server reference the admin calls for all of its RPC (form state, render-document, ...).
 * Replaces the inline `'use server'` closure each Next app has in `(payload)/layout.tsx`.
 */
export async function serverFunction(args: ServerFunctionClientArgs) {
  const { config, importMap } = serverFunctionContext.getStore()!

  return handleServerFunctions({ ...args, config, importMap })
}
