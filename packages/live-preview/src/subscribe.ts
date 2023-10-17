import { handleMessage } from '.'

export const subscribe = <T>(args: {
  callback: (data: T) => void
  depth: number
  initialData: T
  serverURL: string
}): ((event: MessageEvent) => void) => {
  const { callback, depth, initialData, serverURL } = args

  const onMessage = async (event: MessageEvent) => {
    const mergedData = await handleMessage<T>({ depth, event, initialData, serverURL })
    callback(mergedData)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', onMessage)
  }

  return onMessage
}
