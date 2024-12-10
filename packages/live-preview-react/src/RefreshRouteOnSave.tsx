'use client'

import type React from 'react'

import { isDocumentEvent, ready } from '@payloadcms/live-preview'
import { useCallback, useEffect, useRef } from 'react'

export const RefreshRouteOnSave: React.FC<{
  apiRoute?: string
  depth?: number
  refresh: () => void
  serverURL: string
}> = (props) => {
  const { apiRoute, depth, refresh, serverURL } = props
  const hasSentReadyMessage = useRef<boolean>(false)

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (isDocumentEvent(event, serverURL)) {
        if (typeof refresh === 'function') {
          refresh()
        } else {
          // eslint-disable-next-line no-console
          console.error('You must provide a refresh function to `RefreshRouteOnSave`')
        }
      }
    },
    [refresh, serverURL],
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', onMessage)
    }

    if (!hasSentReadyMessage.current) {
      hasSentReadyMessage.current = true

      ready({
        serverURL,
      })

      // refresh after the ready message is sent to get the latest data
      refresh()
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', onMessage)
      }
    }
  }, [serverURL, onMessage, depth, apiRoute, refresh])

  return null
}
