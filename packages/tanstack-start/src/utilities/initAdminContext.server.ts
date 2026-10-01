import type { ServerAdapter } from 'payload'
import type { InitAdminContextArgs } from 'payload/internal'

import { getRequest } from '@tanstack/react-start/server'
import { initAdminContext as initPayloadAdminContext } from 'payload/internal'

// Registers the dev reload strategy before `initPayloadAdminContext` can build an instance.
// Side-effect only, and a no-op outside of dev serve.
import './devConfigReload.server.js'
import { tanstackServerAdapter } from './serverAdapter.server.js'

type TanStackInitAdminContextArgs = {
  serverAdapter?: ServerAdapter
} & Omit<InitAdminContextArgs, 'cache' | 'requestURL' | 'serverAdapter'>

export const initAdminContext = ({
  serverAdapter = tanstackServerAdapter,
  ...args
}: TanStackInitAdminContextArgs) =>
  initPayloadAdminContext({
    ...args,
    requestURL: getRequest().url,
    serverAdapter,
  })
