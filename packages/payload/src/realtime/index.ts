import type { Endpoint } from '../config/types.js'

export type RealtimeEvent = {
  data: Record<string, unknown>
  name: string
}

export type SanitizedRealtimeConfig = {
  events: RealtimeEvent[]
}

export type SubscribeCallback = (args: {
  data: Record<string, unknown>
  event: string
}) => Promise<void> | void

export class Realtime {
  subscribers: SubscribeCallback[] = []

  emit({ data, event }: { data: Record<string, unknown>; event: string }): void {
    this.subscribers.forEach((callback) => {
      void callback({ data, event })
    })
  }

  subscribe(callback: SubscribeCallback): SubscribeCallback {
    this.subscribers.push(callback)

    return callback
  }

  unsubscribe(callback: SubscribeCallback): void {
    this.subscribers = this.subscribers.filter((each) => each !== callback)
  }
}

export const subscribeEndpoint: Endpoint = {
  handler: (req) => {
    const headers = new Headers()
    headers.set('Content-Type', 'text/event-stream')
    headers.set('Cache-Control', 'no-cache')
    headers.set('Connection', 'keep-alive')
    headers.set('Transfer-Encoding', 'chunked')

    const abortController = new AbortController()

    const stream = new ReadableStream({
      cancel() {
        // Ensure abort is triggered if the stream is canceled
        abortController.abort()
      },
      start(controller) {
        let isClosed = false

        const closeStream = () => {
          if (!isClosed) {
            isClosed = true
            req.payload.realtime.unsubscribe(subscription)
            try {
              controller.close()
            } catch {}
          }
        }

        const subscription = req.payload.realtime.subscribe((args) => {
          if (isClosed) {
            return
          } // Prevent enqueueing after close
          try {
            controller.enqueue(`data: ${JSON.stringify(args)}\n\n`)
          } catch {
            closeStream()
          }
        })

        // Handle stream cancellation
        abortController.signal.addEventListener('abort', closeStream)
      },
    })

    return new Response(stream, { headers })
  },
  method: 'get',
  path: '/realtime/subscribe',
}

export const emitEventEndpoint: Endpoint = {
  handler: async (req) => {
    const json = await req.json()

    req.payload.realtime.emit(json)

    return new Response('Event emitted')
  },
  method: 'post',
  path: '/realtime/emit',
}
