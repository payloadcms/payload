import type { CollectionPopulationRequestHandler } from './types.js'

import { handleMessage } from './handleMessage.js'

export const subscribe = <T extends Record<string, any>>(args: {
  apiRoute?: string
  callback: (data: T) => void
  collectionPopulationRequestHandler?: CollectionPopulationRequestHandler
  depth?: number
  initialData: T
  serverURL: string
}): ((event: MessageEvent) => Promise<void> | void) => {
  const { apiRoute, callback, collectionPopulationRequestHandler, depth, initialData, serverURL } =
    args

  const onMessage = async (event: MessageEvent) => {
    const mergedData = await handleMessage<T>({
      apiRoute,
      collectionPopulationRequestHandler,
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
