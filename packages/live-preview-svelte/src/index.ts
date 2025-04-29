import {
  subscribe as payloadSubscribe,
  unsubscribe as payloadUnsubscribe,
  ready,
} from '@payloadcms/live-preview'
import { type Readable, writable } from 'svelte/store'

interface LivePreviewStoreOptions<T extends Record<string, unknown>> {
  initialData: T
  serverURL: string
}

interface LivePreviewStore<T> {
  loading: Readable<boolean>
  subscribe: Readable<T>['subscribe']
}

function createLivePreviewStore<T extends Record<string, unknown>>({
  initialData,
  serverURL,
}: LivePreviewStoreOptions<T>): LivePreviewStore<T> {
  let subscription: ReturnType<typeof payloadSubscribe> | undefined
  let initialized = false

  const loading = writable(false)
  const { subscribe } = writable<T>(initialData, (set) => {
    // Called when the store gets its first subscriber

    if (typeof window === 'undefined') {
      return
    }

    if (!initialized) {
      initialized = true
      ready({ serverURL })

      loading.set(true)
      subscription = payloadSubscribe({
        callback: (doc) => {
          set(doc)
          loading.set(false)
        },
        depth: 1,
        initialData,
        serverURL,
      })
    }

    return () => {
      // Called when the last subscriber unsubscribes
      if (typeof window !== 'undefined' && subscription) {
        payloadUnsubscribe(subscription)
        subscription = undefined
      }
    }
  })

  return {
    loading: { subscribe: loading.subscribe },
    subscribe,
  }
}

export function useLivePreview<T extends Record<string, unknown>>(
  initialData: T,
  options: {
    serverURL: string
  },
) {
  return createLivePreviewStore({
    initialData,
    serverURL: options.serverURL,
  })
}
