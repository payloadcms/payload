import type { GetAdminContextResult } from 'payload'
import type { AdminContextCache, GetAdminContextArgs, PartialAdminContext } from 'payload/internal'

import { getAdminContext as getPayloadAdminContext } from 'payload/internal'

import { nextServerAdapter } from '../adapters/server.js'
import { selectiveCache } from './selectiveCache.js'

const partialContextCache = selectiveCache<PartialAdminContext>('partialContext')
const localeCache = selectiveCache<Pick<GetAdminContextResult, 'locale'>>('locale')
const adminContextCache = selectiveCache<GetAdminContextResult>('adminContext')

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

type NextGetAdminContextArgs = {
  key: string
} & Omit<GetAdminContextArgs, 'cache' | 'key' | 'serverAdapter'>

export const getAdminContext = (args: NextGetAdminContextArgs) =>
  getPayloadAdminContext({
    ...args,
    cache,
    serverAdapter: nextServerAdapter,
  })
