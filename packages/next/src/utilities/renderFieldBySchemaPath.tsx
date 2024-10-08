import type { RenderFieldBySchemaPath } from 'payload'

import { getFieldBySchemaPath } from '@payloadcms/ui/utilities/buildFormState'

import { renderField, renderFields } from './renderFields.js'

export const renderFieldBySchemaPath: RenderFieldBySchemaPath = (args) => {
  const {
    clientConfig,
    clientField,
    collectionSlug,
    formState,
    globalSlug,
    importMap,
    indexPath,
    path,
    req,
    schemaPath: schemaPathFromArgs,
  } = args

  const schemaPath = `${collectionSlug || globalSlug}.${schemaPathFromArgs}`

  const field = getFieldBySchemaPath({
    config: req.payload.config,
    i18n: req.i18n,
    payload: req.payload,
    schemaPath,
  })

  return renderField({
    clientConfig,
    clientField,
    config: req.payload.config,
    field,
    fieldPath: schemaPath,
    fieldPermissions: undefined, // TODO: Add field permissions
    // fieldPermissions: req.payload.permissions?.[schemaPath],
    formState,
    i18n: req.i18n,
    importMap,
    indexPath,
    path,
    payload: req.payload,
    renderFields,
    schemaPath,
  })
}
