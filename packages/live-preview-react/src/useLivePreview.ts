'use client'
import type { CollectionPopulationRequestHandler } from '@payloadcms/live-preview'

import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * This is a React hook to implement {@link https://payloadcms.com/docs/live-preview/overview Payload Live Preview}.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading } = useLivePreview({
 *   initialData: pageData,
 *   serverURL: 'https://your-payload-server.com',
 *   depth: 2,
 * })
 * ```
 *
 * @example
 * ```tsx
 * // Custom request handler (e.g., routing through middleware)
 * const customHandler: CollectionPopulationRequestHandler = async ({ endpoint, data }) => {
 *   return fetch(`https://api.example.com/preview/${endpoint}`, {
 *     method: 'POST',
 *     body: JSON.stringify(data),
 *     credentials: 'include',
 *   })
 * }
 *
 * const { data, isLoading } = useLivePreview({
 *   initialData: pageData,
 *   serverURL: 'https://your-payload-server.com',
 *   requestHandler: customHandler,
 * })
 * ```
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
  /**
   * Custom handler to intercept and modify data fetching.
   * Useful for routing requests through middleware or applying transformations.
   */
  requestHandler?: CollectionPopulationRequestHandler
  serverURL: string
}): {
  data: T
  /**
   * To prevent the flicker of stale data while the post message is being sent,
   * you can conditionally render loading UI based on the `isLoading` state.
   */
  isLoading: boolean
} => {
  const { apiRoute, depth, initialData, requestHandler, serverURL } = props
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
      requestHandler,
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
  }, [serverURL, onChange, depth, initialData, apiRoute, requestHandler])

  return {
    data,
    isLoading,
  }
}
