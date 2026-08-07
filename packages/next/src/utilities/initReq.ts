import type { InitReqArgs, InitReqCache, InitReqPartialResult, InitReqResult } from 'payload'

import { initReq as payloadInitReq } from 'payload'

import { nextServerAdapter } from '../adapters/server.js'
import { selectiveCache } from './selectiveCache.js'

const partialReqCache = selectiveCache<InitReqPartialResult>('partialReq')
const reqCache = selectiveCache<InitReqResult>('req')

const cache: InitReqCache = {
  getPartial: (factory) => partialReqCache.get(factory, 'global'),
  getRequest: (factory, key) => reqCache.get(factory, key),
}

type NextInitReqArgs = {
  key: string
} & Omit<InitReqArgs, 'cache' | 'key' | 'serverAdapter'>

export const initReq = (args: NextInitReqArgs) =>
  payloadInitReq({
    ...args,
    cache,
    serverAdapter: nextServerAdapter,
  })
