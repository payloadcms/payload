import type { SanitizedConfig } from 'payload'

import * as payload from 'payload'
import * as payloadInternal from 'payload/internal'
import * as payloadShared from 'payload/shared'

declare global {
  // Read by the prebuilt runtime and the custom components it compiles, in place of their own imports.
  var __payload_host__: Record<string, unknown> | undefined
}

type Config = Promise<SanitizedConfig> | SanitizedConfig

type Runtime = {
  compileCustomComponents: (args: { config: Config }) => Promise<void>
  createAdminHandler: (args: { config: Config }) => (request: Request) => Promise<Response>
}

/**
 * This module is compiled by the host framework, so `payload` here is the instance the app's config
 * uses. The admin itself is prebuilt and imported natively, out of the host bundler's sight, so it is
 * never compiled again.
 */
const loadRuntime = (config: Config): Promise<Runtime> => {
  globalThis.__payload_host__ = {
    '@payload-config': { default: config },
    payload,
    'payload/internal': payloadInternal,
    'payload/shared': payloadShared,
  }

  // Resolved by Node from the app's `node_modules`, so the package must be a direct dependency. A
  // variable, so that TypeScript doesn't type-check the prebuilt bundle either.
  const runtime = '@payloadcms/admin-runtime/runtime'
  return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ runtime) as Promise<Runtime>
}

/**
 * The admin panel as one Web `fetch` handler, for a catch-all route such as
 * `app/(payload)/admin/[[...segments]]/route.ts`. Custom components from the generated import map are
 * compiled by the runtime itself, into `.payload/admin`.
 */
export function createAdminHandler({ config }: { config: Config }) {
  const handler = loadRuntime(config).then((runtime) => runtime.createAdminHandler({ config }))

  return async (request: Request) => (await handler)(request)
}

/** Compiles the custom components ahead of time, so production never has to. Run by `payload build`. */
export async function compileCustomComponents({ config }: { config: Config }) {
  await (await loadRuntime(config)).compileCustomComponents({ config })
}
