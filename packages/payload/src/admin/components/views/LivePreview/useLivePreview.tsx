import { useCallback, useEffect, useState } from 'react'

export const useLivePreview = (props: { initialPage: any; serverURL: string }): any => {
  const { initialPage, serverURL } = props
  const [data, setData] = useState<any>(initialPage)

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      console.log('message received', event)
      if (event.origin === serverURL && event.data) {
        const eventData = JSON.parse(event?.data)
        if (eventData.type === 'livePreview') {
          setData(eventData?.data)
        }
      }
    },
    [serverURL],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    window.parent.postMessage('ready', serverURL)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [serverURL, handleMessage])

  return data
}
