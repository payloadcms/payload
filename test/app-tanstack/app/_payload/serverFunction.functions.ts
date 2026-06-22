import type { ServerFunctionClientArgs } from 'payload'

import { createServerFunctionClient } from '@payloadcms/tanstack-start'
import { createServerFn } from '@tanstack/react-start'

/**
 * TanStack Start server function that dispatches to the shared Payload server
 * function registry (form-state, table-state, render-document, etc.) using the
 * RSC payload format. The serialization logic lives in the adapter package; this
 * shim supplies the app-owned `config` and generated `importMap`.
 */
export const runPayloadServerFn = createServerFn({ method: 'POST' })
  .validator((args: ServerFunctionClientArgs): ServerFunctionClientArgs => args)
  .handler(async ({ data }) => {
    const { handleServerFunctions } = await import('@payloadcms/tanstack-start/server')
    const config = (await import('@payload-config')).default
    const { importMap } = await import('./importMap.js')

    return (await handleServerFunctions({
      name: data.name,
      args: data.args,
      config,
      importMap,
    })) as any
  })

/**
 * Client-side server function handler wired into `RootProvider.serverFunction`.
 * `createServerFunctionClient` sanitizes args for TanStack Start's seroval wire
 * format, then dispatches through `runPayloadServerFn`.
 */
export const serverFunctionHandler = createServerFunctionClient({
  runServerFn: runPayloadServerFn,
})
