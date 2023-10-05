import { handleMessage } from '.'

export const subscribe = <T>(args: {
  callback: (data: T) => void
  depth: number
  initialData: T
  serverURL: string
}): ((event: MessageEvent) => void) => {
  const { callback, depth, initialData, serverURL } = args

  if (typeof window !== 'undefined') {
    const handleMessageCallback = async (event: MessageEvent) => {
      const mergedData = await handleMessage({ depth, event, initialData, serverURL })
      callback(mergedData)
    }

    window.addEventListener('message', handleMessageCallback)
    window.parent.postMessage('ready', serverURL)

    return handleMessageCallback
  }
}
