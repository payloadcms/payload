import type { Collection, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { APIError } from 'payload'

import type { MongooseAdapter } from '../index.js'
import type { CollectionModel, GlobalModel } from '../types.js'

export const getCollection = ({
  adapter,
  collectionSlug,
  versions = false,
}: {
  adapter: MongooseAdapter
  collectionSlug: string
  versions?: boolean
}): {
  collectionConfig: SanitizedCollectionConfig
  customIDType: Collection['customIDType']

  Model: CollectionModel
} => {
  const collection = adapter.payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `ERROR: Failed to retrieve collection with the slug "${collectionSlug}". Does not exist.`,
    )
  }

  if (versions) {
    const Model = adapter.versions[collectionSlug]

    if (!Model) {
      throw new APIError(
        `ERROR: Failed to retrieve collection version model with the slug "${collectionSlug}". Does not exist.`,
      )
    }

    return { collectionConfig: collection.config, customIDType: collection.customIDType, Model }
  }

  const Model = adapter.collections[collectionSlug]

  if (!Model) {
    throw new APIError(
      `ERROR: Failed to retrieve collection model with the slug "${collectionSlug}". Does not exist.`,
    )
  }

  return { collectionConfig: collection.config, customIDType: collection.customIDType, Model }
}

type BaseGetGlobalArgs = {
  adapter: MongooseAdapter
  globalSlug: string
}

interface GetGlobal {
  (args: { versions?: false | undefined } & BaseGetGlobalArgs): {
    globalConfig: SanitizedGlobalConfig
    Model: GlobalModel
  }
  (args: { versions?: true } & BaseGetGlobalArgs): {
    globalConfig: SanitizedGlobalConfig
    Model: CollectionModel
  }
}

export const getGlobal: GetGlobal = ({ adapter, globalSlug, versions = false }) => {
  const globalConfig = adapter.payload.config.globals.find((each) => each.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(
      `ERROR: Failed to retrieve global with the slug "${globalSlug}". Does not exist.`,
    )
  }

  if (versions) {
    const Model = adapter.versions[globalSlug]

    if (!Model) {
      throw new APIError(
        `ERROR: Failed to retrieve global version model with the slug "${globalSlug}". Does not exist.`,
      )
    }

    return { globalConfig, Model }
  }

  return { globalConfig, Model: adapter.globals } as any
}
