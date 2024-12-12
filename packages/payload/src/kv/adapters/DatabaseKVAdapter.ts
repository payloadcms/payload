import type { CollectionConfig } from '../../index.js'
import type { Payload, PayloadRequest } from '../../types/index.js'
import type { KVAdapter, KVAdapterResult, KVStoreValue } from '../index.js'

/** Mocked `req`, we don't need to use transactions, neither we want `createLocalReq` overhead. */
const req = {} as PayloadRequest

export class DatabaseKVAdapter implements KVAdapter {
  constructor(
    readonly payload: Payload,
    readonly collectionSlug: string,
  ) {}

  async clear(): Promise<void> {
    await this.payload.db.deleteMany({
      collection: this.collectionSlug,
      req,
      where: {},
    })
  }

  async delete(key: string): Promise<void> {
    await this.payload.db.deleteOne({
      collection: this.collectionSlug,
      req,
      where: { key: { equals: key } },
    })
  }

  async get(key: string): Promise<KVStoreValue | null> {
    const doc = await this.payload.db.findOne<{
      data: KVStoreValue
      id: number | string
    }>({
      collection: this.collectionSlug,
      joins: false,
      req,
      select: {
        data: true,
        key: true,
      },
      where: { key: { equals: key } },
    })

    if (doc === null) {
      return null
    }

    return doc.data
  }

  async has(key: string): Promise<boolean> {
    const { totalDocs } = await this.payload.db.count({
      collection: this.collectionSlug,
      req,
      where: { key: { equals: key } },
    })

    return totalDocs > 0
  }

  async keys(): Promise<string[]> {
    const result = await this.payload.db.find<{ key: string }>({
      collection: this.collectionSlug,
      limit: 0,
      pagination: false,
      req,
      select: {
        key: true,
      },
    })

    return result.docs.map((each) => each.key)
  }

  async set(key: string, data: KVStoreValue): Promise<void> {
    await this.payload.db.upsert({
      collection: this.collectionSlug,
      data: {
        data,
        key,
      },
      joins: false,
      req,
      select: {},
      where: { key: { equals: key } },
    })
  }
}

export type DatabaseKVAdapterOptions = {
  /** Override options for the generated collection */
  kvCollectionOverrides?: Partial<CollectionConfig>
}

export const databaseKVAdapter = (options: DatabaseKVAdapterOptions = {}): KVAdapterResult => {
  const collectionSlug = options.kvCollectionOverrides?.slug ?? 'payload-kv'
  return {
    init: ({ payload }) => new DatabaseKVAdapter(payload, collectionSlug),
    kvCollection: {
      slug: collectionSlug,
      access: {
        create: () => false,
        delete: () => false,
        read: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          index: true,
          required: true,
          unique: true,
        },
        {
          name: 'data',
          type: 'json',
          required: true,
        },
      ],
      timestamps: false,
      ...options.kvCollectionOverrides,
    },
  }
}
