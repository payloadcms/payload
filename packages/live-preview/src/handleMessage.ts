import type { FieldSchemaJSON } from 'payload'

import type { CollectionPopulationRequestHandler, LivePreviewMessageEvent } from './types.js'

import { isLivePreviewEvent } from './isLivePreviewEvent.js'
import { mergeData } from './mergeData.js'

const _payloadLivePreview: {
  blocksSchemaMap?: Record<string, FieldSchemaJSON>
  fieldSchema: FieldSchemaJSON | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousData: any
} = {
  /**
   * For performance reasons, `fieldSchemaJSON` and `blocksSchemaMap` will only be sent once on the initial message
   * We need to cache these values so that they can be used across subsequent messages
   * To do this, save `fieldSchemaJSON` and `blocksSchemaMap` when it arrives as global variables
   * Send these cached values to `mergeData`, instead of `eventData.fieldSchemaJSON` and `eventData.blocksSchemaMap` directly
   */
  blocksSchemaMap: undefined,
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
  requestHandler?: CollectionPopulationRequestHandler
  serverURL: string
}): Promise<T> => {
  const { apiRoute, depth, event, initialData, requestHandler, serverURL } = args

  if (isLivePreviewEvent(event, serverURL)) {
    const { blocksSchemaMap, data, externallyUpdatedRelationship, fieldSchemaJSON, locale } =
      event.data

    if (!_payloadLivePreview?.fieldSchema && fieldSchemaJSON) {
      _payloadLivePreview.fieldSchema = fieldSchemaJSON
    }
    if (!_payloadLivePreview.blocksSchemaMap && blocksSchemaMap) {
      _payloadLivePreview.blocksSchemaMap = blocksSchemaMap
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
      blocksSchemaMap: _payloadLivePreview.blocksSchemaMap,
      depth,
      externallyUpdatedRelationship,
      fieldSchema: _payloadLivePreview.fieldSchema,
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
