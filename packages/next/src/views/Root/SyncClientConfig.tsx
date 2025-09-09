'use client'
import type { ClientConfig } from 'payload'

import { useConfig } from '@payloadcms/ui'
import { useEffect } from 'react'

/**
 * This component is required n order for the _page_ to be able to refresh the client config,
 * which may have been cached on the _layout_ level, where the ConfigProvider lives.
 * Since the layout does not re-render on page navigation, we need to manually update the config
 * when the page changes, as it may have gone from unauthenticated to authenticated, which affects
 * the client config.
 */
export const SyncClientConfig = ({ clientConfig }: { clientConfig: ClientConfig }) => {
  const { setConfig } = useConfig()

  useEffect(() => {
    setConfig(clientConfig)
  }, [clientConfig, setConfig])

  return null
}
