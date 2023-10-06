import { mergeData } from '.'

export const handleMessage = async <T>(args: {
  depth: number
  event: MessageEvent
  initialData: T
  serverURL: string
}): Promise<T> => {
  const { depth, event, initialData, serverURL } = args

  if (event.origin === serverURL && event.data) {
    const eventData = JSON.parse(event?.data)

    if (eventData.type === 'livePreview') {
      const mergedData = await mergeData<T>({
        depth,
        fieldSchema: eventData.fieldSchemaJSON,
        incomingData: eventData.data,
        initialData,
        serverURL,
      })

      return mergedData
    }
  }

  return initialData
}
