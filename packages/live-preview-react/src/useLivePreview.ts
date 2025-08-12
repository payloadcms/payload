'use client'
import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * This is a React hook to implement {@link https://payloadcms.com/docs/live-preview/overview Payload Live Preview}.
 *
 * @link https://payloadcms.com/docs/live-preview/frontend
 */
// NOTE: cannot use Record<string, unknown> here bc generated interfaces will not satisfy the type constraint
export const useLivePreview = <T extends Record<string, any>>(props: {
  apiRoute?: string
  depth?: number
  /**
   * To prevent the flicker of missing data on initial load,
   * you can pass in the initial page data from the server.
   */
  initialData: T
  serverURL: string
}): {
  data: T
  /**
   * To prevent the flicker of stale data while the post message is being sent,
   * you can conditionally render loading UI based on the `isLoading` state.
   */
  isLoading: boolean
} => {
  const { apiRoute, depth, initialData, serverURL } = props
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const hasSentReadyMessage = useRef<boolean>(false)

  const onChange = useCallback((mergedData: T) => {
    setData(mergedData)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const subscription = subscribe({
      apiRoute,
      callback: onChange,
      depth,
      initialData,
      serverURL,
    })

    if (!hasSentReadyMessage.current) {
      hasSentReadyMessage.current = true

      ready({
        serverURL,
      })
    }

    return () => {
      unsubscribe(subscription)
    }
  }, [serverURL, onChange, depth, initialData, apiRoute])

  return {
    data,
    isLoading,
  }
}
