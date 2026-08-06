import type { InitReqArgs, ServerAdapter } from 'payload'

import { getRequest } from '@tanstack/react-start/server'
import { initReq as payloadInitReq } from 'payload'

// Registers the dev reload strategy before `payloadInitReq` can build an instance.
// Side-effect only, and a no-op outside of dev serve.
import './devConfigReload.server.js'
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
