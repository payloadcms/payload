import type { ArrayField, ClientSlotProps, RenderRowsBySchemaPath, ServerSlotProps } from 'payload'

import { getFieldBySchemaPath } from '@payloadcms/ui/utilities/buildFormState'

import { renderFieldRows } from './renderFields.js'

export const renderRowsBySchemaPath: RenderRowsBySchemaPath = (args) => {
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
    rows,
    schemaPath: schemaPathFromArgs,
  } = args

  const schemaPath = `${collectionSlug || globalSlug}.${schemaPathFromArgs}`

  const field = getFieldBySchemaPath({
    config: req.payload.config,
    i18n: req.i18n,
    payload: req.payload,
    schemaPath,
  }) as ArrayField

  const fieldState = formState[path]

  const clientProps: ClientSlotProps = {
    field: clientField,
    fieldState,
    path,
    permissions: undefined, // TODO
    readOnly: undefined, // TODO
    schemaPath,
  }

  const serverProps: ServerSlotProps = {
    clientField,
    config: req.payload.config,
    field,
    i18n: req.i18n,
    indexPath,
    payload: req.payload,
  }

  return renderFieldRows({
    // className, // TODO
    clientConfig,
    clientField,
    clientProps,
    config: req.payload.config,
    field,
    fieldState,
    formState,
    i18n: req.i18n,
    importMap,
    indexPath,
    margins: undefined, // TODO
    path,
    payload: req.payload,
    // permissions, // TODO
    fieldPath: path,
    rows,
    schemaPath,
    serverProps,
  })
}
