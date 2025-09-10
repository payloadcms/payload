import type { CollectionPopulationRequestHandler, LivePreviewMessageEvent } from './types.js'

import { isLivePreviewEvent } from './isLivePreviewEvent.js'
import { mergeData } from './mergeData.js'

const _payloadLivePreview: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousData: any
} = {
  /**
   * Each time the data is merged, cache the result as a `previousData` variable
   * This will ensure changes compound overtop of each other
   */
  previousData: undefined,
}

export const handleMessage = async <T extends Record<string, any>>(args: {
  apiRoute?: string
  depth?: number
  event: LivePreviewMessageEvent<T>
  initialData: T
  requestHandler?: CollectionPopulationRequestHandler
  serverURL: string
}): Promise<T> => {
  const { apiRoute, depth, event, initialData, requestHandler, serverURL } = args

  if (isLivePreviewEvent(event, serverURL)) {
    const { collectionSlug, data, globalSlug, locale } = event.data

    const mergedData = await mergeData<T>({
      apiRoute,
      collectionSlug,
      depth,
      globalSlug,
      incomingData: data,
      initialData: _payloadLivePreview?.previousData || initialData,
      locale,
      requestHandler,
      serverURL,
    })

    _payloadLivePreview.previousData = mergedData

    return mergedData
  }

  if (!_payloadLivePreview.previousData) {
    _payloadLivePreview.previousData = initialData
  }

  return _payloadLivePreview.previousData as T
}
