import { handleMessage } from './handleMessage.js'

export const subscribe = <T extends Record<string, any>>(args: {
  apiRoute?: string
  callback: (data: T) => void
  depth?: number
  initialData: T
  serverURL: string
}): ((event: MessageEvent) => Promise<void> | void) => {
  const { apiRoute, callback, depth, initialData, serverURL } = args

  const onMessage = async (event: MessageEvent) => {
    const mergedData = await handleMessage<T>({
      apiRoute,
      depth,
      event,
      initialData,
      serverURL,
    })

    callback(mergedData)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', onMessage)
  }

  return onMessage
}
