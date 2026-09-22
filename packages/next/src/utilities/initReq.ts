import type { InitReqArgs, InitReqCache, InitReqPartialResult, InitReqResult } from 'payload'

import { initReq as initPayloadReq } from 'payload'

import { nextServerAdapter } from '../adapters/server.js'
import { selectiveCache } from './selectiveCache.js'

const partialReqCache = selectiveCache<InitReqPartialResult>('partialReq')
const localeCache = selectiveCache<Pick<InitReqResult, 'locale'>>('locale')
const reqCache = selectiveCache<InitReqResult>('req')

const cache: InitReqCache = {
  getLocale: (factory, ...cacheArgs) => localeCache.get(factory, ...cacheArgs),
  getPartial: (factory) => partialReqCache.get(factory, 'global'),
  getRequest: (factory, key, ...cacheArgs) => reqCache.get(factory, key, ...cacheArgs),
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
