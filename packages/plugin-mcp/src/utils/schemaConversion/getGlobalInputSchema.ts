import { entityToStandaloneJSONSchema, type GlobalSlug, type PayloadRequest } from 'payload'

import type { JsonSchemaType } from '../../types.js'

import { getGlobalVirtualFieldNames } from '../getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from './removeVirtualFieldsFromSchema.js'
import { sanitizeEntitySchema } from './sanitizeEntitySchema.js'

export const getGlobalInputSchema = ({
  globalSlug,
  req,
}: {
  globalSlug: GlobalSlug
  req: PayloadRequest
}): JsonSchemaType | null => {
  const global = req.payload.config.globals.find((globalConfig) => globalConfig.slug === globalSlug)

  if (!global) {
    return null
  }

  const globalSchema = removeVirtualFieldsFromSchema(
    entityToStandaloneJSONSchema({
      config: req.payload.config,
      defaultIDType: req.payload.db.defaultIDType,
      entity: global,
      i18n: req.i18n,
    }) as unknown as JsonSchemaType,
    getGlobalVirtualFieldNames(req.payload.config, globalSlug),
  )

  return sanitizeEntitySchema(globalSchema)
}
