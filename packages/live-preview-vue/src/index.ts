import type { Ref } from 'vue'

import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview'
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Vue composable to implement Payload CMS Live Preview.
 *
 * {@link https://payloadcms.com/docs/live-preview/frontend View the documentation}
 */
export const useLivePreview = <T>(props: {
  apiRoute?: string
  depth?: number
  initialData: T
  serverURL: string
}): {
  data: Ref<T>
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

  let subscription: (event: MessageEvent) => void

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
