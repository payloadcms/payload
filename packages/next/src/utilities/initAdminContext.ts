import type { AdminContext } from 'payload'
import type { AdminContextCache, InitAdminContextArgs, PartialAdminContext } from 'payload/internal'

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

export const initAdminContext = (args: NextInitAdminContextArgs) =>
  initPayloadAdminContext({
    ...args,
    cache,
    serverAdapter: nextServerAdapter,
  })
