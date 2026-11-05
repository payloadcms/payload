import type { AdminContext } from 'payload'
import type { AdminContextCache, InitAdminContextArgs, PartialAdminContext } from 'payload/internal'

import { connection } from 'next/server.js'
import { initAdminContext as initPayloadAdminContext } from 'payload/internal'

import { nextServerAdapter } from '../adapters/server.js'
import { selectiveCache } from './selectiveCache.js'

const partialContextCache = selectiveCache<PartialAdminContext>('partialContext')
const localeCache = selectiveCache<Pick<AdminContext, 'locale'>>('locale')
const adminContextCache = selectiveCache<AdminContext>('adminContext')

const cache: AdminContextCache = {
  getLocale: (resolveLocale, ...key) => localeCache.get({ create: resolveLocale, key }),
  getPartial: (createPartialContext) =>
    partialContextCache.get({ create: createPartialContext, key: ['global'] }),
  getRequest: (createContext, key, ...cacheArgs) =>
    adminContextCache.get({
      create: createContext,
      key: [key, ...cacheArgs],
    }),
}

type NextInitAdminContextArgs = {
  key: string
} & Omit<InitAdminContextArgs, 'cache' | 'key' | 'serverAdapter'>

export const initAdminContext = async (args: NextInitAdminContextArgs) => {
  // Without this, enabling `cacheComponents` throws as soon as the admin panel calls `new Date()`
  // (e.g. inside the database adapter): "Next.js encountered the unstable value `new Date()` while
  // prerendering". `connection()` tells Next.js to wait for the incoming request, so everything
  // after it renders per request and can use `new Date()`, `Math.random()`, etc.
  // https://nextjs.org/docs/app/api-reference/functions/connection
  await connection()

  return initPayloadAdminContext({
    ...args,
    cache,
    serverAdapter: nextServerAdapter,
  })
}
