import type { ClientComponentProps, ClientField, FieldPaths, ServerComponentProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { createClientField, MissingEditorProp } from 'payload'
import { fieldIsHiddenOrDisabled } from 'payload/shared'

import type { RenderFieldMethod } from './types.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- need this to reference already existing bundle. Otherwise, bundle size increases., payload/no-imports-from-exports-dir
import { FieldDescription } from '../../exports/client/index.js'

const defaultUIFieldComponentKeys: Array<'Cell' | 'Description' | 'Field' | 'Filter'> = [
  'Cell',
  'Description',
  'Field',
  'Filter',
]

export const renderField: RenderFieldMethod = ({
  id,
  clientFieldSchemaMap,
  collectionSlug,
  data,
  fieldConfig,
  fieldSchemaMap,
  fieldState,
  formState,
  indexPath,
  operation,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  preferences,
  req,
  schemaPath,
  siblingData,
}) => {
  const clientField = clientFieldSchemaMap
    ? (clientFieldSchemaMap.get(schemaPath) as ClientField)
    : createClientField({
        defaultIDType: req.payload.config.db.defaultIDType,
        field: fieldConfig,
        i18n: req.i18n,
        importMap: req.payload.importMap,
      })

  if (fieldIsHiddenOrDisabled(clientField)) {
    return
  }

  const clientProps: ClientComponentProps & Partial<FieldPaths> = {
    customComponents: fieldState?.customComponents || {},
    field: clientField,
    path,
    readOnly: typeof permissions === 'boolean' ? !permissions : !permissions?.[operation],
    schemaPath,
  }

  // fields with subfields
  if (['array', 'blocks', 'collapsible', 'group', 'row', 'tabs'].includes(fieldConfig.type)) {
    clientProps.indexPath = indexPath
    clientProps.parentPath = parentPath
    clientProps.parentSchemaPath = parentSchemaPath
  }

  const serverProps: ServerComponentProps = {
    id,
    clientField,
    clientFieldSchemaMap,
    data,
    field: fieldConfig,
    fieldSchemaMap,
    permissions,
    // TODO: Should we pass explicit values? initialValue, value, valid
    // value and initialValue should be typed
    collectionSlug,
    formState,
    i18n: req.i18n,
    operation,
    payload: req.payload,
    preferences,
    req,
    siblingData,
    user: req.user,
  }

  if (!fieldState?.customComponents) {
    fieldState.customComponents = {}
  }

  switch (fieldConfig.type) {
    // TODO: handle block row labels as well in a similar fashion
    case 'array': {
      fieldState?.rows?.forEach((row, rowIndex) => {
        if (fieldConfig.admin?.components && 'RowLabel' in fieldConfig.admin.components) {
          if (!fieldState.customComponents.RowLabels) {
            fieldState.customComponents.RowLabels = []
          }

          fieldState.customComponents.RowLabels[rowIndex] = RenderServerComponent({
            clientProps,
            Component: fieldConfig.admin.components.RowLabel,
            importMap: req.payload.importMap,
            serverProps: {
              ...serverProps,
              rowLabel: `${getTranslation(fieldConfig.labels.singular, req.i18n)} ${String(
                rowIndex + 1,
              ).padStart(2, '0')}`,
              rowNumber: rowIndex + 1,
            },
          })
        }
      })

      break
    }

    case 'richText': {
      if (!fieldConfig?.editor) {
        throw new MissingEditorProp(fieldConfig) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }

      if (typeof fieldConfig?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      if (!fieldConfig.admin) {
        fieldConfig.admin = {}
      }

      if (!fieldConfig.admin.components) {
        fieldConfig.admin.components = {}
      }

      fieldState.customComponents.Field = RenderServerComponent({
        clientProps,
        Component: fieldConfig.editor.FieldComponent,
        importMap: req.payload.importMap,
        serverProps,
      })

      break
    }

    case 'ui': {
      if (fieldConfig?.admin?.components) {
        // Render any extra, untyped components
        for (const key in fieldConfig.admin.components) {
          if (key in defaultUIFieldComponentKeys) {
            continue
          }
          const Component = fieldConfig.admin.components[key]
          fieldState.customComponents[key] = RenderServerComponent({
            clientProps,
            Component,
            importMap: req.payload.importMap,
            key: `field.admin.components.${key}`,
            serverProps,
          })
        }
      }
      break
    }

    default: {
      break
    }
  }

  if (fieldConfig.admin) {
    if ('description' in fieldConfig.admin) {
      if (typeof fieldConfig.admin?.description === 'function') {
        fieldState.customComponents.Description = (
          <FieldDescription
            description={fieldConfig.admin?.description({
              t: req.i18n.t,
            })}
            path={path}
          />
        )
      }
    }

    if (fieldConfig.admin?.components) {
      if ('afterInput' in fieldConfig.admin.components) {
        fieldState.customComponents.AfterInput = RenderServerComponent({
          clientProps,
          Component: fieldConfig.admin.components.afterInput,
          importMap: req.payload.importMap,
          key: 'field.admin.components.afterInput',
          serverProps,
        })
      }

      if ('beforeInput' in fieldConfig.admin.components) {
        fieldState.customComponents.BeforeInput = RenderServerComponent({
          clientProps,
          Component: fieldConfig.admin.components.beforeInput,
          importMap: req.payload.importMap,
          key: 'field.admin.components.beforeInput',
          serverProps,
        })
      }

      if ('Description' in fieldConfig.admin.components) {
        fieldState.customComponents.Description = RenderServerComponent({
          clientProps,
          Component: fieldConfig.admin.components.Description,
          importMap: req.payload.importMap,
          key: 'field.admin.components.Description',
          serverProps,
        })
      }

      if ('Error' in fieldConfig.admin.components) {
        fieldState.customComponents.Error = RenderServerComponent({
          clientProps,
          Component: fieldConfig.admin.components.Error,
          importMap: req.payload.importMap,
          key: 'field.admin.components.Error',
          serverProps,
        })
      }

      if ('Label' in fieldConfig.admin.components) {
        fieldState.customComponents.Label = RenderServerComponent({
          clientProps,
          Component: fieldConfig.admin.components.Label,
          importMap: req.payload.importMap,
          key: 'field.admin.components.Label',
          serverProps,
        })
      }

      if ('Field' in fieldConfig.admin.components) {
        fieldState.customComponents.Field = RenderServerComponent({
          clientProps,
          Component: fieldConfig.admin.components.Field,
          importMap: req.payload.importMap,
          key: 'field.admin.components.Field',
          serverProps,
        })
      }
    }
  }
}
