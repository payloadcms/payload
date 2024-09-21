import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  ClientGlobalConfig,
  RenderConfigArgs,
} from 'payload'

import { getCreateMappedComponent } from '@payloadcms/ui/shared'
import { createClientCollectionConfig } from '@payloadcms/ui/utilities/createClientCollectionConfig'
import { createClientConfig } from '@payloadcms/ui/utilities/createClientConfig'
import { createClientFields } from '@payloadcms/ui/utilities/createClientFields'
import { createClientGlobalConfig } from '@payloadcms/ui/utilities/createClientGlobalConfig'

import { getPayloadHMR } from './getPayloadHMR.js'

export const renderConfig = async (
  args: RenderConfigArgs,
): Promise<ClientCollectionConfig | ClientConfig | ClientField[] | ClientGlobalConfig> => {
  const {
    collectionSlug,
    config: configPromise,
    data,
    globalSlug,
    i18n,
    importMap,
    schemaPath,
    serverProps,
  } = args

  const config = await configPromise

  const payload = await getPayloadHMR({ config })

  const createMappedComponent = getCreateMappedComponent({
    importMap,
    serverProps: {
      ...(serverProps || {}),
      payload,
    },
  })

  if (schemaPath) {
    const renderedSchemaPath = createClientFields({
      config,
      createMappedComponent,
      importMap,
      payload,
    })

    return renderedSchemaPath
  }

  if (collectionSlug) {
    const renderedCollectionConfig = createClientCollectionConfig({
      collection: config.collections.find((collection) => collection.slug === collectionSlug),
      createMappedComponent,
      data,
      i18n,
      importMap,
      payload,
    })

    return renderedCollectionConfig
  }

  if (globalSlug) {
    const renderedGlobalConfig = createClientGlobalConfig({
      createMappedComponent,
      global: config.globals.find((global) => global.slug === globalSlug),
      i18n,
      importMap,
      payload,
    })

    return renderedGlobalConfig
  }

  const renderedRootConfig = await createClientConfig({
    config,
    createMappedComponent,
    i18n,
  })

  return renderedRootConfig
}
