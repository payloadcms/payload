import type { ServerAdapter } from 'payload'
import type { GetAdminContextArgs } from 'payload/internal'

import { getRequest } from '@tanstack/react-start/server'
import { getAdminContext as getPayloadAdminContext } from 'payload/internal'

// Registers the dev reload strategy before `getPayloadAdminContext` can build an instance.
// Side-effect only, and a no-op outside of dev serve.
import './devConfigReload.server.js'
import { tanstackServerAdapter } from './serverAdapter.server.js'

type TanStackGetAdminContextArgs = {
  serverAdapter?: ServerAdapter
} & Omit<GetAdminContextArgs, 'cache' | 'requestURL' | 'serverAdapter'>

export const getAdminContext = ({
  serverAdapter = tanstackServerAdapter,
  ...args
}: TanStackGetAdminContextArgs) =>
  getPayloadAdminContext({
    ...args,
    requestURL: getRequest().url,
    serverAdapter,
  })
