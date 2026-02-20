import type { CollectionPopulationRequestHandler } from '@payloadcms/live-preview'
import type { Ref } from 'vue'

import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview'
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * This is a Vue composable to implement {@link https://payloadcms.com/docs/live-preview/overview Payload Live Preview}.
 *
 * @example
 * ```ts
 * // Basic usage
 * const { data, isLoading } = useLivePreview({
 *   initialData: pageData,
 *   serverURL: 'https://your-payload-server.com',
 *   depth: 2,
 * })
 * ```
 *
 * @example
 * ```ts
 * // Custom request handler (e.g., routing through middleware)
 * const customHandler = async ({ endpoint, data }) => {
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
  data: Ref<T>
  /**
   * To prevent the flicker of stale data while the post message is being sent,
   * you can conditionally render loading UI based on the `isLoading` state.
   */
  isLoading: Ref<boolean>
} => {
  const { apiRoute, depth, initialData, requestHandler, serverURL } = props
  const data = ref(initialData) as Ref<T>
  const isLoading = ref(true)
  const hasSentReadyMessage = ref(false)

  const onChange = (mergedData: T) => {
    data.value = mergedData
    isLoading.value = false
  }

  let subscription: (event: MessageEvent) => Promise<void> | void

  onMounted(() => {
    subscription = subscribe({
      apiRoute,
      callback: onChange,
      depth,
      initialData,
      requestHandler,
      serverURL,
    })

    if (!hasSentReadyMessage.value) {
      hasSentReadyMessage.value = true

      ready({
        serverURL,
      })
    }
  })

  onUnmounted(() => {
    unsubscribe(subscription)
  })

  return {
    data,
    isLoading,
  }
}
