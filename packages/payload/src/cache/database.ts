import type { CollectionConfig } from '../collections/config/types.js'
import type { Payload, PayloadRequest } from '../types/index.js'
import type { PayloadCache, PayloadCacheConstructor } from './index.js'

const req = {} as PayloadRequest

export const databaseCacheAdapter = ({
  collectionOverrides = {},
}: {
  collectionOverrides?: Partial<CollectionConfig>
}): PayloadCacheConstructor => {
  const constructor: PayloadCacheConstructor = class DatabaseCache<
    Data extends Record<string, unknown> = Record<string, unknown>,
  > implements PayloadCache<Data>
  {
    type = 'database'

    constructor(private readonly payload: Payload) {}

    async clear(): Promise<void> {
      await this.payload.db.deleteMany({
        collection: 'payload-cache',
        req,
        where: {},
      })
    }

    async delete(key: string): Promise<void> {
      await this.payload.db.deleteOne({
        collection: 'payload-cache',
        req,
        where: { key: { equals: key } },
      })
    }

    async getAll(): Promise<{ data: Data; key: string }[]> {
      const { docs } = await this.payload.db.find<{
        data: Data
        key: string
      }>({
        collection: 'payload-cache',
        joins: false,
        limit: 0,
        pagination: false,
        req,
        select: {
          data: true,
          key: true,
        },
      })

      return docs
    }

    async getByKey(key: string): Promise<Data | null> {
      const doc = await this.payload.db.findOne<{
        data: Data
        id: number | string
      }>({
        collection: 'payload-cache',
        joins: false,
        req,
        select: {
          data: true,
          key: true,
        },
        where: { key: { equals: key } },
      })

      return doc.data
    }

    async getKeys(): Promise<string[]> {
      const { docs } = await this.payload.db.find<{
        key: string
      }>({
        collection: 'payload-cache',
        limit: 0,
        pagination: false,
        req,
        select: { key: true },
      })

      return docs.map((doc) => doc.key)
    }

    async set(key: string, data: Data): Promise<void> {
      await this.payload.db.updateOne({
        collection: 'payload-cache',
        data: {
          data,
        },
        joins: false,
        req,
        select: {},
        where: { key: { equals: key } },
      })
    }
  }

  constructor.getPayloadCacheCollection = function () {
    return {
      slug: 'payload-cache',
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
      ...collectionOverrides,
    }
  }

  return constructor
}
