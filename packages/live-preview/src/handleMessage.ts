import { mergeData } from '.'

// For performance reasons, `fieldSchemaJSON` will only be sent once on the initial message
// We need to cache this value so that it can be used across subsequent messages
// To do this, save `fieldSchemaJSON` when it arrives as a global variable
// Send this cached value to `mergeData`, instead of `eventData.fieldSchemaJSON` directly
let payloadLivePreviewFieldSchema = undefined // TODO: type this from `fieldSchemaToJSON` return type

// Each time the data is merged, cache the result as a `previousData` variable
// This will ensure changes compound overtop of each other
let payloadLivePreviewPreviousData = undefined

export const handleMessage = async <T>(args: {
  apiRoute?: string
  depth?: number
  event: MessageEvent
  initialData: T
  serverURL: string
}): Promise<T> => {
  const { apiRoute, depth, event, initialData, serverURL } = args

  const { data, externallyUpdatedRelationship, fieldSchemaJSON } = event.data

  if (!payloadLivePreviewFieldSchema && fieldSchemaJSON) {
    payloadLivePreviewFieldSchema = fieldSchemaJSON
  }

  if (!payloadLivePreviewFieldSchema) {
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
    fieldSchema: payloadLivePreviewFieldSchema,
    incomingData: data,
    initialData: payloadLivePreviewPreviousData || initialData,
    serverURL,
  })

  payloadLivePreviewPreviousData = mergedData

  return mergedData
}
