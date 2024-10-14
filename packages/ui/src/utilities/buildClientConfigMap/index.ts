import type { ClientConfig, ClientConfigMap } from 'payload'

import { traverseFields } from './traverseFields.js'

export const buildClientConfigMap = (args: { clientConfig: ClientConfig }): ClientConfigMap => {
  const { clientConfig } = args

  const result: ClientConfigMap = new Map()

  clientConfig.collections.forEach((collection) => {
    traverseFields({
      clientConfig,
      fields: collection.fields,
      schemaMap: result,
      schemaPath: collection.slug,
    })
  })

  clientConfig.globals.forEach((global) => {
    traverseFields({
      clientConfig,
      fields: global.fields,
      schemaMap: result,
      schemaPath: global.slug,
    })
  })

  return result
}
