import type {
  AdminContext,
  DefaultServerFunctionArgs,
  ImportMap,
  SanitizedConfig,
  ServerFunction,
  ServerFunctionHandler,
} from 'payload'

import { sharedServerFunctions } from './serverFunctionRegistry.js'

type InitAdminContextFn = (args: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  requestURL?: string
}) => Promise<AdminContext>

type CreateServerFunctionHandlerArgs = {
  /**
   * Framework-specific admin context creation. The adapter closes over its own
   * `ServerAdapter` / request source (Next.js: `initAdminContext` + `nextServerAdapter`;
   * TanStack Start: its `getRequest()`-based `initAdminContext`).
   */
  initAdminContext: InitAdminContextFn
  /**
   * Additional handlers registered alongside `sharedServerFunctions`. Reserved
   * for adapter-specific functions; today both adapters run the shared set only.
   */
  serverFunctions?: Record<string, ServerFunction<any, any>>
}

/**
 * Factory for the framework-agnostic `handleServerFunctions` entry point.
 *
 * All adapters dispatch from the shared registry (`sharedServerFunctions`) and
 * inject their own admin context. Each framework owns its native response transport.
 */
export const createServerFunctionHandler = ({
  initAdminContext,
  serverFunctions,
}: CreateServerFunctionHandlerArgs): ServerFunctionHandler => {
  const baseServerFunctions: Record<string, ServerFunction<any, any>> = serverFunctions
    ? { ...sharedServerFunctions, ...serverFunctions }
    : sharedServerFunctions

  return async (args) => {
    const {
      name: fnKey,
      args: fnArgs,
      config: configPromise,
      importMap,
      serverFunctions: extraServerFunctions,
    } = args

    const { cookies, locale, permissions, req, user } = await initAdminContext({
      configPromise,
      importMap,
      requestURL: args.requestURL,
    })

    const augmentedArgs: DefaultServerFunctionArgs = {
      ...fnArgs,
      cookies,
      importMap,
      locale,
      permissions,
      req,
      user,
    }

    const fn = extraServerFunctions?.[fnKey] || baseServerFunctions[fnKey]

    if (!fn) {
      throw new Error(`Unknown Server Function: ${fnKey}`)
    }

    return await fn(augmentedArgs)
  }
}
