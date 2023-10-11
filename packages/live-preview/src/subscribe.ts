import { handleMessage } from '.'

export const subscribe = <T>(args: {
  callback: (data: T) => void
  depth: number
  initialData: T
  serverURL: string
}): ((event: MessageEvent) => void) => {
  const { callback, depth, initialData, serverURL } = args

  const onMessage = async (event: MessageEvent) => {
    const mergedData = await handleMessage({ depth, event, initialData, serverURL })
    callback(mergedData)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', onMessage)

    // This subscription may have been from either an iframe `src` or `window.open()`
    // i.e. `window?.opener` || `window?.parent`

    window?.opener?.postMessage(
      JSON.stringify({
        popupReady: true,
        type: 'payload-live-preview',
      }),
      serverURL,
    )
  }

  return onMessage
}
