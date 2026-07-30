import type { InitReqArgs, ServerAdapter } from 'payload'

import { getRequest } from '@tanstack/react-start/server'
import { initReq as payloadInitReq } from 'payload'

import { tanstackServerAdapter } from './serverAdapter.server.js'

type TanStackInitReqArgs = {
  serverAdapter?: ServerAdapter
} & Omit<InitReqArgs, 'cache' | 'requestURL' | 'serverAdapter'>

export const initReq = ({ serverAdapter = tanstackServerAdapter, ...args }: TanStackInitReqArgs) =>
  payloadInitReq({
    ...args,
    requestURL: getRequest().url,
    serverAdapter,
  })
