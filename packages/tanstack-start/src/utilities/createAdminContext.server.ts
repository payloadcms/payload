import type { ServerAdapter } from 'payload'
import type { CreateAdminContextArgs } from 'payload/internal'

import { getRequest } from '@tanstack/react-start/server'
import { createAdminContext as createPayloadAdminContext } from 'payload/internal'

// Registers the dev reload strategy before `createPayloadAdminContext` can build an instance.
// Side-effect only, and a no-op outside of dev serve.
import './devConfigReload.server.js'
import { tanstackServerAdapter } from './serverAdapter.server.js'

type TanStackCreateAdminContextArgs = {
  serverAdapter?: ServerAdapter
} & Omit<CreateAdminContextArgs, 'cache' | 'requestURL' | 'serverAdapter'>

export const createAdminContext = ({
  serverAdapter = tanstackServerAdapter,
  ...args
}: TanStackCreateAdminContextArgs) =>
  createPayloadAdminContext({
    ...args,
    requestURL: getRequest().url,
    serverAdapter,
  })
