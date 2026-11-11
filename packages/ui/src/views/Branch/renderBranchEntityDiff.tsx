import type { ClientConfig, CollectionSlug, Field, PayloadRequest } from 'payload'
import type React from 'react'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getClientSchemaMap } from '../../utilities/getClientSchemaMap.js'
import { getSchemaMap } from '../../utilities/getSchemaMap.js'
import { RenderDiff } from '../Version/RenderFieldsToDiff/index.js'

// Branch writes always change these fields, so including them would add noise to every diff.
const timestampFields = new Set(['createdAt', 'updatedAt'])

export const renderBranchEntityDiff = ({
  collectionSlug,
  fields,
  globalSlug,
  req,
  versionFromSiblingData,
  versionToSiblingData,
}: {
  collectionSlug?: CollectionSlug
  fields: Field[]
  globalSlug?: string
  req: PayloadRequest
  versionFromSiblingData: object
  versionToSiblingData: object
}): { clientConfig: ClientConfig; diff: React.ReactNode } => {
  const { i18n, payload } = req
  const { config } = payload
  const entitySlug = globalSlug ?? collectionSlug

  if (!entitySlug) {
    throw new Error('A collection or global slug is required to render a branch diff.')
  }

  const contentFields = fields.filter(
    (field) => !('name' in field) || !timestampFields.has(field.name),
  )
  const schemaMap = getSchemaMap({ collectionSlug, config, globalSlug, i18n })
  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
    user: req.user,
  })
  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: clientConfig,
    globalSlug,
    i18n,
    payload,
    schemaMap,
  })

  return {
    clientConfig,
    diff: RenderDiff({
      clientSchemaMap,
      customDiffComponents: {},
      entitySlug,
      fields: contentFields,
      fieldsPermissions: true,
      i18n,
      modifiedOnly: true,
      parentIndexPath: '',
      parentIsLocalized: false,
      parentPath: '',
      parentSchemaPath: '',
      req,
      selectedLocales: [],
      versionFromSiblingData,
      versionToSiblingData,
    }),
  }
}
