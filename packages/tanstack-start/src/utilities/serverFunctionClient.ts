import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'

import { stripUnserializable } from './stripUnserializable.js'

/**
 * Builds the client-side `ServerFunctionClient` wired into
 * `RootProvider.serverFunction`, given the app's `createServerFn`-based
 * dispatcher (`runServerFn`).
 *
 * Delegates to `runServerFn`, so the response (including any RSC handles for
 * server-rendered custom components) is decoded by TanStack Start back into
 * renderable React nodes on the client.
 */
export function createServerFunctionClient({
  runServerFn,
}: {
  runServerFn: (input: { data: ServerFunctionClientArgs }) => Promise<unknown>
}): ServerFunctionClient {
  return (async (args: ServerFunctionClientArgs) => {
    return await runServerFn({ data: stripUnserializable(args) as ServerFunctionClientArgs })
  }) as ServerFunctionClient
}
