import type { PayloadSDK } from '../index.js'
import type { PayloadGeneratedTypes } from '../types.js'

export const subscribe = async <T extends PayloadGeneratedTypes>(
  sdk: PayloadSDK<T>,
  onEvent: (args: { data: Record<string, any>; event: string }) => void,
): Promise<{ response: Response; unsubscribe: () => Promise<void> }> => {
  const response = await sdk.request({
    method: 'GET',
    path: '/realtime/subscribe',
  })

  if (
    !response.ok ||
    !response.headers.get('Content-Type')?.includes('text/event-stream') ||
    !response.body
  ) {
    throw new Error('Expected SSE response, but got: ' + response.statusText)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let done = false
  let buffer = ''

  const unsubscribe = async () => {
    // Cancel the stream
    done = true
    await reader.cancel()
  }

  const processStream = async () => {
    try {
      while (!done) {
        const { done: doneReading, value } = await reader.read()
        if (doneReading) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        let boundary = buffer.indexOf('\n\n')
        while (boundary !== -1) {
          const eventRaw = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 2)
          const data = JSON.parse(eventRaw.slice(5, boundary))
          onEvent(data)

          boundary = buffer.indexOf('\n\n')
        }
      }
    } catch (err) {
      if (!done) {
        console.error('Error processing the stream:', err)
      }
    } finally {
      reader.releaseLock()
    }
  }

  void processStream()

  return { response, unsubscribe }
}
