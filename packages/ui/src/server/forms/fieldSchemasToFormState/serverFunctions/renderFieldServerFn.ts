import { type Field, type FieldState, type ServerFunction, UnauthorizedError } from 'payload'

import { getClientConfig } from '../../../utilities/getClientConfig.js'
import { getClientSchemaMap } from '../../../utilities/getClientSchemaMap.js'
import { getSchemaMap } from '../../../utilities/getSchemaMap.js'
import { renderField } from '../renderField.js'
import { mergeAllowedFieldOverrides } from './mergeAllowedFieldOverrides.js'

export type RenderFieldServerFnArgs = {
  /** Overrides admin.hidden from the schemaPath lookup. */
  hidden?: boolean
  /**
   * Pass the value this field will receive when rendering it on the server.
   * For richText, this helps provide initial state for sub-fields that are immediately rendered (like blocks)
   * so that we can avoid multiple waterfall requests for each block that renders on the client.
   */
  initialValue?: unknown
  /** Overrides the label from the schemaPath lookup. Use false to hide it. */
  label?: false | Record<string, string> | string
  /** Overrides the form field name from the schemaPath lookup. */
  name?: string
  /**
   * Path to the field to render
   * @default field name
   */
  path?: string
  /**
   * Dot schema path to a richText field declared in your config.
   * Format:
   *   "collection.<collectionSlug>.<fieldPath>"
   *   "global.<globalSlug>.<fieldPath>"
   *
   * Examples:
   *   "collection.posts.richText"
   *   "global.siteSettings.content"
   */
  schemaPath: string
}
export type RenderFieldServerFnReturnType = {} & FieldState['customComponents']

/**
 * @experimental - may break in minor releases
 */
export const _internal_renderFieldHandler: ServerFunction<
  RenderFieldServerFnArgs,
  Promise<RenderFieldServerFnReturnType>
  // eslint-disable-next-line @typescript-eslint/require-await
> = async ({ name, hidden, initialValue, label, path, req, schemaPath, user }) => {
  if (!req.user) {
    throw new UnauthorizedError()
  }

  const [entityType, entitySlug, ...fieldPath] = schemaPath.split('.')

  const schemaMap = getSchemaMap({
    collectionSlug: entityType === 'collection' ? entitySlug : undefined,
    config: req.payload.config,
    globalSlug: entityType === 'global' ? entitySlug : undefined,
    i18n: req.i18n,
  })

  // Provide client schema map as it would have been provided if the target editor field would have been rendered.
  // For lexical, only then will it contain all the lexical-internal entries
  const clientSchemaMap = getClientSchemaMap({
    collectionSlug: entityType === 'collection' ? entitySlug : undefined,
    config: getClientConfig({
      config: req.payload.config,
      i18n: req.i18n,
      importMap: req.payload.importMap,
      user: req.user,
    }),
    globalSlug: entityType === 'global' ? entitySlug : undefined,
    i18n: req.i18n,
    payload: req.payload,
    schemaMap,
  })

  const targetField = schemaMap.get(`${entitySlug}.${fieldPath.join('.')}`) as Field | undefined

  if (!targetField) {
    throw new Error(`Could not find target field at schemaPath: ${schemaPath}`)
  }

  const field: Field = mergeAllowedFieldOverrides({
    overrides: { name, admin: { hidden }, label },
    targetField,
  })
  const hasPropOverrides = name !== undefined || label !== undefined || hidden !== undefined

  let data = {}
  if (typeof initialValue !== 'undefined') {
    if ('name' in field) {
      data[field.name] = initialValue
    } else {
      data = initialValue
    }
  }

  const fieldState: FieldState = {}
  renderField({
    clientFieldSchemaMap: clientSchemaMap,
    collectionSlug: entityType === 'collection' && entitySlug ? entitySlug : '-',
    data,
    fieldConfig: field,
    fieldSchemaMap: schemaMap,
    fieldState, // TODO,
    formState: {}, // TODO,
    indexPath: '',
    lastRenderedPath: '',
    operation: 'create',
    parentPath: '',
    parentSchemaPath: '',
    path: path ?? ('name' in field ? field.name : ''),
    permissions: true,
    preferences: {
      fields: {},
    },
    // Create a new client field when presentation values differ from the schema config.
    forceCreateClientField: hasPropOverrides,
    previousFieldState: undefined,
    renderAllFields: true,
    req,
    schemaPath: `${entitySlug}.${fieldPath.join('.')}`,
    siblingData: data,
    user,
  })

  return fieldState.customComponents ?? {}
}
