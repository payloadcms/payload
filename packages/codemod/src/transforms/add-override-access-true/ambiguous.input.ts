declare function makePayload(): unknown

const payload = makePayload() as {
  create(options: { collection: string; data: unknown }): Promise<unknown>
}

await payload.create({ collection: 'posts', data: {} })
await payload.create({ collection: 'posts', data: {}, overrideAccess: false })
