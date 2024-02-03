import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview'
import { type Ref, ref, watchEffect } from 'vue'

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
}): { data: Ref<T>; isLoading: Ref<boolean> } => {
  const { apiRoute, depth, initialData, serverURL } = props
  const data = ref(initialData) as Ref<T> // Workaround for weird Ref<T> behavior
  const isLoading = ref(true)
  const hasSentReadyMessage = ref(false)

  const onChange = (mergedData: T) => {
    data.value = mergedData
    isLoading.value = false
  }

  watchEffect((onCleanup) => {
    const subscription = subscribe({
      apiRoute,
      callback: onChange,
      depth,
      initialData,
      serverURL,
    })

    if (!hasSentReadyMessage.value) {
      hasSentReadyMessage.value = true
      ready({ serverURL })
    }

    onCleanup(() => {
      unsubscribe(subscription)
    })
  })

  return { data, isLoading }
}
