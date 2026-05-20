import type { Field, FormStateWithoutComponents, ServerFunction } from 'payload'

import { deepMerge, UnauthorizedError } from 'payload'

import type { RenderFieldServerFnArgs } from '../../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js'

import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'
import { renderField } from '../../forms/fieldSchemasToFormState/renderField.js'
import { getClientConfig } from '../getClientConfig.js'
import { getClientSchemaMap } from '../getClientSchemaMap.js'
import { getSchemaMap } from '../getSchemaMap.js'

export type RenderFieldDataOnlyResult = {
  fieldState: FormStateWithoutComponents
}

/**
 * Data-only alternative to `_internal_renderFieldHandler`.
 * Returns field state data without rendered custom components.
 * The client handles component rendering via import map resolution.
 */
export const renderFieldDataOnlyHandler: ServerFunction<
  RenderFieldServerFnArgs,
  Promise<RenderFieldDataOnlyResult>
  // eslint-disable-next-line @typescript-eslint/require-await
> = async ({ field: fieldArg, initialValue, path, req, schemaPath }) => {
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

  const field: Field = fieldArg ? deepMerge(targetField, fieldArg, { clone: false }) : targetField

  let data = {}

  if (typeof initialValue !== 'undefined') {
    if ('name' in field) {
      data[field.name] = initialValue
    } else {
      data = initialValue
    }
  }

  const fieldState: FormStateWithoutComponents = {}

  renderField({
    clientFieldSchemaMap: clientSchemaMap,
    collectionSlug: entityType === 'collection' && entitySlug ? entitySlug : '-',
    data,
    fieldConfig: field,
    fieldSchemaMap: schemaMap,
    fieldState,
    forceCreateClientField: fieldArg ? true : false,
    formState: {},
    indexPath: '',
    lastRenderedPath: '',
    operation: 'create',
    parentPath: '',
    parentSchemaPath: '',
    path: path ?? ('name' in field ? field.name : ''),
    permissions: true,
    preferences: { fields: {} },
    previousFieldState: undefined,
    renderAllFields: true,
    renderComponent: RenderClientComponent,
    req,
    schemaPath: `${entitySlug}.${fieldPath.join('.')}`,
    siblingData: data,
  })

  // Strip customComponents from each field state entry for serialization
  const strippedState: FormStateWithoutComponents = {}

  for (const [key, value] of Object.entries(fieldState)) {
    const { customComponents: _components, ...stateWithoutComponents } = value as any
    strippedState[key] = stateWithoutComponents
  }

  return { fieldState: strippedState }
}
