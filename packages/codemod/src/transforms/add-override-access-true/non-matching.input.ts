declare function makeClient(): {
  create(options: { data: unknown }): Promise<unknown>
  find(options: { query: unknown }): Promise<unknown>
}

const client = makeClient()

await client.create({ data: {} })
await client.find({ query: {} })

declare class Payload {
  find(options: { query: unknown }): Promise<unknown>
}

declare const unrelatedPayload: Payload

await unrelatedPayload.find({ query: {} })

import type { Payload as PayloadInstance } from 'payload'

declare const maybePayload: PayloadInstance | Payload

await maybePayload.find({ query: {} })
