import type { ServerAdapter } from 'payload'
import type { InitReqArgs } from 'payload/internal'

import { getRequest } from '@tanstack/react-start/server'
import { initReq as initPayloadReq } from 'payload/internal'

// Registers the dev reload strategy before `initPayloadReq` can build an instance.
// Side-effect only, and a no-op outside of dev serve.
import './devConfigReload.server.js'
import { tanstackServerAdapter } from './serverAdapter.server.js'

type TanStackInitReqArgs = {
  serverAdapter?: ServerAdapter
} & Omit<InitReqArgs, 'cache' | 'requestURL' | 'serverAdapter'>

export const initReq = ({ serverAdapter = tanstackServerAdapter, ...args }: TanStackInitReqArgs) =>
  initPayloadReq({
    ...args,
    requestURL: getRequest().url,
    serverAdapter,
  })
