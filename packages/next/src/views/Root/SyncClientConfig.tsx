'use client'
import type { ClientConfig } from 'payload'

import { useConfig } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

/**
 * This component is required in order for the _page_ to be able to refresh the client config,
 * which may have been cached on the _layout_ level, where the ConfigProvider is managed.
 * Since the layout does not re-render on page navigation / authentication, we need to manually
 * update the config, as the user may have been authenticated in the process, which affects the client config.
 */
export const SyncClientConfig = ({ clientConfig }: { clientConfig: ClientConfig }) => {
  const { setConfig } = useConfig()
  const initialRender = useRef(true)

  useEffect(() => {
    // Can skip the initial render, as the config will already be set by the layout
    if (initialRender.current) {
      initialRender.current = false
      return
    }

    setConfig(clientConfig)
  }, [clientConfig, setConfig])

  return null
}
