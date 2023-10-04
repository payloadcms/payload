import { useCallback, useEffect, useState } from 'react'

import { mergeLiveData } from './mergeData'

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

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.origin === serverURL && event.data) {
        const eventData = JSON.parse(event?.data)

        if (eventData.type === 'livePreview') {
          const mergedData = await mergeLiveData<T>({
            depth,
            existingData: data,
            fieldSchema: eventData.fieldSchemaJSON,
            incomingData: eventData.data,
            serverURL,
          })

          setData(mergedData)

          setIsLoading(false)
        }
      }
    },
    [serverURL, data, depth],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    window.parent.postMessage('ready', serverURL)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [serverURL, handleMessage])

  return {
    data,
    isLoading,
  }
}
