import type { FieldSchemaJSON } from 'payload'

import type { LivePreviewMessageEvent } from './types.js'

import { isLivePreviewEvent } from './isLivePreviewEvent.js'
import { mergeData } from './mergeData.js'

const _payloadLivePreview: {
  fieldSchema: FieldSchemaJSON | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousData: any
} = {
  /**
   * For performance reasons, `fieldSchemaJSON` will only be sent once on the initial message
   * We need to cache this value so that it can be used across subsequent messages
   * To do this, save `fieldSchemaJSON` when it arrives as a global variable
   * Send this cached value to `mergeData`, instead of `eventData.fieldSchemaJSON` directly
   */
  fieldSchema: undefined,
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
  serverURL: string
}): Promise<T> => {
  const { apiRoute, depth, event, initialData, serverURL } = args

  if (isLivePreviewEvent(event, serverURL)) {
    const { data, externallyUpdatedRelationship, fieldSchemaJSON, locale } = event.data

    if (!_payloadLivePreview?.fieldSchema && fieldSchemaJSON) {
      _payloadLivePreview.fieldSchema = fieldSchemaJSON
    }

    if (!_payloadLivePreview?.fieldSchema) {
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
      fieldSchema: _payloadLivePreview.fieldSchema,
      incomingData: data,
      initialData: _payloadLivePreview?.previousData || initialData,
      locale,
      serverURL,
    })

    _payloadLivePreview.previousData = mergedData

    return mergedData
  }

  return initialData
}
