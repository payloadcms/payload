import type { CreateAdminContextResult } from 'payload'
import type { AdminContextCache, CreateAdminContextArgs, PartialAdminContext } from 'payload/internal'

import { createAdminContext as createPayloadAdminContext } from 'payload/internal'

import { nextServerAdapter } from '../adapters/server.js'
import { selectiveCache } from './selectiveCache.js'

const partialContextCache = selectiveCache<PartialAdminContext>('partialContext')
const localeCache = selectiveCache<Pick<CreateAdminContextResult, 'locale'>>('locale')
const adminContextCache = selectiveCache<CreateAdminContextResult>('adminContext')

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

type NextCreateAdminContextArgs = {
  key: string
} & Omit<CreateAdminContextArgs, 'cache' | 'key' | 'serverAdapter'>

export const createAdminContext = (args: NextCreateAdminContextArgs) =>
  createPayloadAdminContext({
    ...args,
    cache,
    serverAdapter: nextServerAdapter,
  })
