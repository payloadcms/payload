import type { PubSubAdapter, PubSubAdapterResult } from 'payload'

import { Redis } from 'ioredis'

export class RedisPubSubAdapter implements PubSubAdapter {
  listenerClient: Redis
  publisherClient: Redis

  constructor(redisURL: string) {
    this.listenerClient = new Redis(redisURL)
    this.publisherClient = new Redis(redisURL)
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisherClient.publish(channel, message)
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.listenerClient.subscribe(channel)
    this.listenerClient.on('message', (subChannel, message) => {
      if (subChannel === channel) {
        callback(message)
      }
    })
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.listenerClient.unsubscribe(channel)
  }
}

export type RedisPubSubAdapterOptions = {
  /** Redis connection URL (e.g., 'redis://localhost:6379'). Defaults to process.env.REDIS_URL */
  redisURL?: string
}

export const redisPubSubAdapter = (
  options: RedisPubSubAdapterOptions = {},
): PubSubAdapterResult => {
  const redisURL = options.redisURL ?? process.env.REDIS_URL

  if (!redisURL) {
    throw new Error('redisURL or REDIS_URL env variable is required')
  }

  return {
    init: () => new RedisPubSubAdapter(redisURL),
  }
}
