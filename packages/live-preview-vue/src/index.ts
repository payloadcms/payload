import type { Ref } from 'vue'

import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview'
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * This is a Vue composable to implement {@link https://payloadcms.com/docs/live-preview/overview Payload Live Preview}.
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
  serverURL: string
}): {
  data: Ref<T>
  /**
   * To prevent the flicker of stale data while the post message is being sent,
   * you can conditionally render loading UI based on the `isLoading` state.
   */
  isLoading: Ref<boolean>
} => {
  const { apiRoute, depth, initialData, serverURL } = props
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
