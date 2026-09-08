import type {
  DefaultServerFunctionArgs,
  ImportMap,
  InitReqResult,
  SanitizedConfig,
  ServerFunction,
  ServerFunctionHandler,
} from 'payload'

import { sharedServerFunctions } from './serverFunctionRegistry.js'

type InitReq = (args: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
}) => Promise<InitReqResult>

type CreateServerFunctionHandlerArgs = {
  /**
   * Framework-specific request initialization. The adapter closes over its own
   * `ServerAdapter` / request source (Next.js: `initReq` + `nextServerAdapter`;
   * TanStack Start: its `getRequest()`-based `initReq`).
   */
  initReq: InitReq
  /**
   * Additional handlers registered alongside `sharedServerFunctions`. Reserved
   * for adapter-specific functions; today both adapters run the shared set only.
   */
  serverFunctions?: Record<string, ServerFunction<any, any>>
  /**
   * Post-processes each handler's return value before it goes over the wire.
   * The TanStack Start adapter passes `serializeForRsc` to convert React
   * elements into RSC handles; Next.js ships them natively and omits this.
   */
  transformResult?: (result: unknown) => Promise<unknown> | unknown
}

/**
 * Factory for the framework-agnostic `handleServerFunctions` entry point.
 *
 * All adapters dispatch from the shared registry (`sharedServerFunctions`) and
 * differ only in the two injected hooks below — `initReq` and `transformResult`
 * — so there is a single dispatch implementation and the handler sets cannot
 * drift between frameworks.
 */
export const createServerFunctionHandler = ({
  initReq,
  serverFunctions,
  transformResult,
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

    const { cookies, locale, permissions, req } = await initReq({ configPromise, importMap })

    const augmentedArgs: DefaultServerFunctionArgs = {
      ...fnArgs,
      cookies,
      importMap,
      locale,
      permissions,
      req,
    }

    const fn = extraServerFunctions?.[fnKey] || baseServerFunctions[fnKey]

    if (!fn) {
      throw new Error(`Unknown Server Function: ${fnKey}`)
    }

    const result = await fn(augmentedArgs)

    return transformResult ? await transformResult(result) : result
  }
}
