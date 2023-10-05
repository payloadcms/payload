import { useCallback, useEffect, useState } from 'react'

import { subscribe, unsubscribe } from '../../live-preview/src'

// To prevent the flicker of missing data on initial load,
// you can pass in the initial page data from the server
// To prevent the flicker of stale data while the post message is being sent,
// you can conditionally render loading UI based on the `isLoading` state

export const useLivePreview = <T extends any>(props: {
  depth?: number
  initialPage: T
  serverURL: string
}): {
  data: T
  isLoading: boolean
} => {
  const { depth = 0, initialPage, serverURL } = props
  const [data, setData] = useState<T>(initialPage)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const onChange = useCallback((mergedData) => {
    setData(mergedData)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const subscription = subscribe({
      callback: onChange,
      depth,
      initialData: initialPage,
      serverURL,
    })

    return () => {
      unsubscribe(subscription)
    }
  }, [serverURL, onChange, depth, initialPage])

  return {
    data,
    isLoading,
  }
}
