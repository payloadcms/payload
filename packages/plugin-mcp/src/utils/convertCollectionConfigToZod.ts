import { jsonSchemaToZod } from 'json-schema-to-zod'
import { type CollectionConfig, configToJSONSchema, type SanitizedConfig } from 'payload'
import { z } from 'zod'

export const convertCollectionConfigToZod = (collectionConfig: CollectionConfig) => {
  const sanitizedConfig = {
    admin: {
      timezones: {
        supportedTimezones: [],
      },
    },
    collections: [collectionConfig],
    globals: [],
  } as unknown as SanitizedConfig
  const schema = configToJSONSchema(sanitizedConfig)

  const collectionSchema = schema?.definitions?.[collectionConfig.slug]
  if (!collectionSchema) {
    return z.object({})
  }

  // Remove properties that should not be included in the Zod schema
  delete collectionSchema?.properties?.createdAt
  delete collectionSchema?.properties?.updatedAt

  const zodSchemaAsString = jsonSchemaToZod(collectionSchema)

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const zodSchema = new Function('z', `return ${zodSchemaAsString}`)(z)

  return zodSchema
}
