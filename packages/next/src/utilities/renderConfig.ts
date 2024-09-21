import type {
  ClientCollectionConfig,
  ClientField,
  ClientGlobalConfig,
  ImportMap,
  SanitizedConfig,
} from 'payload'

import { createClientCollectionConfig } from '@payloadcms/ui/utilities/createClientCollectionConfig'
import { createClientFields } from '@payloadcms/ui/utilities/createClientFields'
import { createClientGlobalConfig } from '@payloadcms/ui/utilities/createClientGlobalConfig'

import { getPayloadHMR } from './getPayloadHMR.js'

export const renderConfig = async (args: {
  collectionSlug?: string
  config: Promise<SanitizedConfig> | SanitizedConfig
  globalSlug?: string
  importMap: ImportMap
  schemaPath?: string
}): Promise<ClientCollectionConfig | ClientField[] | ClientGlobalConfig> => {
  const { collectionSlug, config: configPromise, globalSlug, importMap, schemaPath } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  if (schemaPath) {
    const renderedSchemaPath = createClientFields({
      config,
      importMap,
      payload,
    })

    return renderedSchemaPath
  }

  if (collectionSlug) {
    const renderedCollectionConfig = createClientCollectionConfig({
      clientCollection: {} as ClientCollectionConfig,
      collection: config.collections.find((collection) => collection.slug === collectionSlug),
      config,
      importMap,
      payload,
    })

    return renderedCollectionConfig
  }

  if (globalSlug) {
    const renderedGlobalConfig = createClientGlobalConfig({
      clientGlobal: {} as ClientGlobalConfig,
      config,
      global: config.globals.find((global) => global.slug === globalSlug),
      importMap,
      payload,
    })

    return renderedGlobalConfig
  }

  return null
}
