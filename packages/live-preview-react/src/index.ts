import { subscribe, unsubscribe } from '@payloadcms/live-preview'
import { useCallback, useEffect, useState } from 'react'

// To prevent the flicker of missing data on initial load,
// you can pass in the initial page data from the server
// To prevent the flicker of stale data while the post message is being sent,
// you can conditionally render loading UI based on the `isLoading` state

export const useLivePreview = <T extends any>(props: {
  depth?: number
  initialData: T
  serverURL: string
}): {
  data: T
  isLoading: boolean
} => {
  const { depth = 0, initialData, serverURL } = props
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const onChange = useCallback((mergedData) => {
    setData(mergedData)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const subscription = subscribe({
      callback: onChange,
      depth,
      initialData,
      serverURL,
    })

    return () => {
      unsubscribe(subscription)
    }
  }, [serverURL, onChange, depth, initialData])

  return {
    data,
    isLoading,
  }
}
