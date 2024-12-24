import type { Payload } from '../types/index.js'

export type PubSubAdapter = {
  publish: (channel: string, message: string) => Promise<void>
  subscribe: (channel: string, callback: (message: string) => void) => Promise<void>
  unsubscribe: (channel: string) => Promise<void>
}

export type PubSubAdapterResult = {
  init: (args: { payload: Payload }) => PubSubAdapter
}
