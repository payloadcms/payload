import { mergeData } from '.'

// For performance reasons, `fieldSchemaJSON` will only be sent once on the initial message
// We need to cache this value so that it can be used across subsequent messages
// To do this, save `fieldSchemaJSON` when it arrives as a global variable
// Send this cached value to `mergeData`, instead of `eventData.fieldSchemaJSON` directly
let payloadLivePreviewFieldSchema = undefined // TODO: type this from `fieldSchemaToJSON` return type

export const handleMessage = async <T>(args: {
  depth: number
  event: MessageEvent
  initialData: T
  serverURL: string
}): Promise<T> => {
  const { depth, event, initialData, serverURL } = args
  if (event.origin === serverURL && event.data) {
    const eventData = JSON.parse(event?.data)

    if (eventData.type === 'payload-live-preview') {
      if (!payloadLivePreviewFieldSchema && eventData.fieldSchemaJSON) {
        payloadLivePreviewFieldSchema = eventData.fieldSchemaJSON
      }

      if (!payloadLivePreviewFieldSchema) {
        // eslint-disable-next-line no-console
        console.warn(
          'Payload Live Preview: No `fieldSchemaJSON` was received from the parent window.',
        )

        return initialData
      }

      const mergedData = await mergeData<T>({
        depth,
        fieldSchema: payloadLivePreviewFieldSchema,
        incomingData: eventData.data,
        initialData,
        serverURL,
      })

      return mergedData
    }
  }

  return initialData
}
