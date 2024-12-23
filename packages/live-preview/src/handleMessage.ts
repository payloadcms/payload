import type { LivePreviewMessageEvent } from './types.js'

import { isLivePreviewEvent } from './isLivePreviewEvent.js'
import { mergeData } from './mergeData.js'

global._payload = {
  /**
   * For performance reasons, `fieldSchemaJSON` will only be sent once on the initial message
   * We need to cache this value so that it can be used across subsequent messages
   * To do this, save `fieldSchemaJSON` when it arrives as a global variable
   * Send this cached value to `mergeData`, instead of `eventData.fieldSchemaJSON` directly
   */
  livePreviewFieldSchema: undefined,
  /**
   * Each time the data is merged, cache the result as a `previousData` variable
   * This will ensure changes compound overtop of each other
   */
  livePreviewPreviousData: undefined,
}

export const handleMessage = async <T>(args: {
  apiRoute?: string
  depth?: number
  event: LivePreviewMessageEvent<T>
  initialData: T
  serverURL: string
}): Promise<T> => {
  const { apiRoute, depth, event, initialData, serverURL } = args

  if (isLivePreviewEvent(event, serverURL)) {
    const { data, externallyUpdatedRelationship, fieldSchemaJSON, locale } = event.data

    if (!global._payload.livePreviewFieldSchema && fieldSchemaJSON) {
      global._payload.livePreviewFieldSchema = fieldSchemaJSON
    }

    if (!global._payload.livePreviewFieldSchema) {
      // eslint-disable-next-line no-console
      console.warn(
        'Payload Live Preview: No `fieldSchemaJSON` was received from the parent window. Unable to merge data.',
      )

      return initialData
    }

    const mergedData = await mergeData<T>({
      apiRoute,
      depth,
      externallyUpdatedRelationship,
      fieldSchema: global._payload.livePreviewFieldSchema,
      incomingData: data,
      initialData: global._payload.livePreviewPreviousData || initialData,
      locale,
      serverURL,
    })

    global._payload.livePreviewPreviousData = mergedData

    return mergedData
  }

  return initialData
}
