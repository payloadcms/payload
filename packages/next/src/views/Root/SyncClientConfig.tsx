'use client'
import type { ClientConfig } from 'payload'

import { useConfig } from '@payloadcms/ui'
import { useEffect } from 'react'

export const SyncClientConfig = ({ clientConfig }: { clientConfig: ClientConfig }) => {
  const { setConfig } = useConfig()

  useEffect(() => {
    setConfig(clientConfig)
  }, [clientConfig, setConfig])

  return null
}
