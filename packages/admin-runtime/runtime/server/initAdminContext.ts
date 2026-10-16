import type { ServerAdapter } from 'payload'
import type { AdminContextCache, InitAdminContextArgs } from 'payload/internal'

import { initAdminContext as initPayloadAdminContext } from 'payload/internal'

export type InitAdminContextFn = (
  args: { serverAdapter?: ServerAdapter } & Omit<
    InitAdminContextArgs,
    'cache' | 'requestURL' | 'serverAdapter'
  >,
) => ReturnType<typeof initPayloadAdminContext>

type MemoNode = { children: Map<unknown, MemoNode>; value?: Promise<unknown> }

/**
 * A per-request `initAdminContext`. Replaces the Next adapter's `React.cache` dedupe with a cache
 * that lives as long as the request, keyed by argument identity like `React.cache`.
 */
export function createInitAdminContext({
  request,
  serverAdapter,
}: {
  request: Request
  serverAdapter: ServerAdapter
}): InitAdminContextFn {
  const root: MemoNode = { children: new Map() }

  const memo = <T>(args: unknown[], create: () => Promise<T>): Promise<T> => {
    let node = root
    for (const arg of args) {
      if (!node.children.has(arg)) {
        node.children.set(arg, { children: new Map() })
      }
      node = node.children.get(arg)!
    }
    node.value ??= create()
    return node.value as Promise<T>
  }

  const cache: AdminContextCache = {
    getLocale: (resolveLocale, ...cacheArgs) => memo(['locale', ...cacheArgs], resolveLocale),
    getPartial: (createPartialContext) => memo(['partial'], createPartialContext),
    getRequest: (createContext, key, ...cacheArgs) =>
      memo(['request', key, ...cacheArgs], createContext),
  }

  return ({ serverAdapter: serverAdapterOverride, ...args }) =>
    initPayloadAdminContext({
      ...args,
      cache,
      key: args.key ?? 'admin',
      requestURL: request.url,
      serverAdapter: serverAdapterOverride ?? serverAdapter,
    })
}
