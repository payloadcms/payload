import type { InitReqResult } from 'payload'
import type { InitReqArgs, InitReqCache, InitReqPartialResult } from 'payload/internal'

import { initReq as initPayloadReq } from 'payload/internal'

import { nextServerAdapter } from '../adapters/server.js'
import { selectiveCache } from './selectiveCache.js'

const partialResultCache = selectiveCache<InitReqPartialResult>('partialResult')
const localeCache = selectiveCache<Pick<InitReqResult, 'locale'>>('locale')
const requestResultCache = selectiveCache<InitReqResult>('requestResult')

const cache: InitReqCache = {
  getLocale: (resolveLocale, ...key) => localeCache.get({ create: resolveLocale, key }),
  getPartial: (createPartialResult) =>
    partialResultCache.get({ create: createPartialResult, key: ['global'] }),
  getRequest: (createRequestResult, key, ...cacheArgs) =>
    requestResultCache.get({
      create: createRequestResult,
      key: [key, ...cacheArgs],
    }),
}

type NextInitReqArgs = {
  key: string
} & Omit<InitReqArgs, 'cache' | 'key' | 'serverAdapter'>

export const initReq = (args: NextInitReqArgs) =>
  initPayloadReq({
    ...args,
    cache,
    serverAdapter: nextServerAdapter,
  })
