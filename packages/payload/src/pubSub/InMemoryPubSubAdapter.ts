/* eslint-disable @typescript-eslint/require-await */
import type { PubSubAdapter, PubSubAdapterResult } from './index.js'

export class InMemoryPubSubAdapter implements PubSubAdapter {
  private subscriptions: Record<string, ((message: string) => void)[]> = {}

  async publish(channel: string, message: string): Promise<void> {
    const subscribers = this.subscriptions[channel] || []

    for (const subscriber of subscribers) {
      subscriber(message)
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.subscriptions[channel]) {
      this.subscriptions[channel] = []
    }

    this.subscriptions[channel].push(callback)
  }

  async unsubscribe(channel: string): Promise<void> {
    delete this.subscriptions[channel]
  }
}

export const inMemoryPubSubAdapter = (): PubSubAdapterResult => {
  return {
    init: () => new InMemoryPubSubAdapter(),
  }
}
