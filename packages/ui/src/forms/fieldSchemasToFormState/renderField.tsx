import type {
  ClientComponentProps,
  ClientField,
  FieldPaths,
  FlattenedBlock,
  ServerComponentProps,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { createClientField, MissingEditorProp } from 'payload'
import { fieldIsHiddenOrDisabled } from 'payload/shared'

import type { RenderFieldMethod } from './types.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- need this to reference already existing bundle. Otherwise, bundle size increases., payload/no-imports-from-exports-dir
import { FieldDescription, WatchCondition } from '../../exports/client/index.js'

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
  lastRenderedPath,
  mockRSCs,
  operation,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  preferences,
  renderAllFields,
  req,
  schemaPath,
  siblingData,
}) => {
  const requiresRender = renderAllFields || !lastRenderedPath || lastRenderedPath !== path

  if (!requiresRender && fieldConfig.type !== 'array' && fieldConfig.type !== 'blocks') {
    return
  }

  const clientField = clientFieldSchemaMap
    ? (clientFieldSchemaMap.get(schemaPath) as ClientField)
    : createClientField({
        defaultIDType: req.payload.config.db.defaultIDType,
        field: fieldConfig,
        i18n: req.i18n,
        importMap: req.payload.importMap,
      })

  const clientProps: ClientComponentProps & Partial<FieldPaths> = {
    field: clientField,
    path,
    permissions,
    readOnly: typeof permissions === 'boolean' ? !permissions : !permissions?.[operation],
    schemaPath,
  }

  if (fieldState?.customComponents) {
    clientProps.customComponents = fieldState.customComponents
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

  switch (fieldConfig.type) {
    case 'array': {
      fieldState?.rows?.forEach((row, rowIndex) => {
        const rowLastRenderedPath = row.lastRenderedPath

        const rowPath = `${path}.${rowIndex}`

        const rowRequiresRender =
          renderAllFields || !rowLastRenderedPath || rowLastRenderedPath !== rowPath

        if (!rowRequiresRender) {
          return
        }

        row.lastRenderedPath = rowPath

        if (fieldConfig.admin?.components && 'RowLabel' in fieldConfig.admin.components) {
          if (!row.customComponents) {
            row.customComponents = {}
          }

          row.customComponents.RowLabel = !mockRSCs
            ? RenderServerComponent({
                clientProps,
                Component: fieldConfig.admin.components.RowLabel,
                importMap: req.payload.importMap,
                key: `${rowIndex}`,
                serverProps: {
                  ...serverProps,
                  rowLabel: `${getTranslation(fieldConfig.labels.singular, req.i18n)} ${String(
                    rowIndex + 1,
                  ).padStart(2, '0')}`,
                  rowNumber: rowIndex + 1,
                },
              })
            : 'Mock'
        }
      })

      break
    }

    case 'blocks': {
      fieldState?.rows?.forEach((row, rowIndex) => {
        const rowLastRenderedPath = row.lastRenderedPath

        const rowPath = `${path}.${rowIndex}`

        const rowRequiresRender =
          renderAllFields || !rowLastRenderedPath || rowLastRenderedPath !== rowPath

        if (!rowRequiresRender) {
          return
        }

        row.lastRenderedPath = rowPath

        const blockTypeToMatch: string = row.blockType

        const blockConfig =
          req.payload.blocks[blockTypeToMatch] ??
          ((fieldConfig.blockReferences ?? fieldConfig.blocks).find(
            (block) => typeof block !== 'string' && block.slug === blockTypeToMatch,
          ) as FlattenedBlock | undefined)

        if (blockConfig.admin?.components && 'Label' in blockConfig.admin.components) {
          if (!fieldState.rows[rowIndex]?.customComponents) {
            fieldState.rows[rowIndex].customComponents = {}
          }

          fieldState.rows[rowIndex].customComponents.RowLabel = !mockRSCs
            ? RenderServerComponent({
                clientProps,
                Component: blockConfig.admin.components.Label,
                importMap: req.payload.importMap,
                key: `${rowIndex}`,
                serverProps: {
                  ...serverProps,
                  blockType: row.blockType,
                  rowLabel: `${getTranslation(blockConfig.labels.singular, req.i18n)} ${String(
                    rowIndex + 1,
                  ).padStart(2, '0')}`,
                  rowNumber: rowIndex + 1,
                },
              })
            : 'Mock'
        }
      })

      break
    }
  }

  if (!requiresRender) {
    return
  }

  /**
   * Set the `lastRenderedPath` equal to the new path of the field, this will prevent it from being rendered again
   */
  fieldState.lastRenderedPath = path

  if (fieldIsHiddenOrDisabled(clientField)) {
    return
  }

  /**
   * Only create the `customComponents` object if needed.
   * This will prevent unnecessary data from being transferred to the client.
   */
  if (fieldConfig.admin) {
    if (
      (Object.keys(fieldConfig.admin.components || {}).length > 0 ||
        fieldConfig.type === 'richText' ||
        ('description' in fieldConfig.admin &&
          typeof fieldConfig.admin.description === 'function')) &&
      !fieldState?.customComponents
    ) {
      fieldState.customComponents = {}
    }
  }

  switch (fieldConfig.type) {
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

      fieldState.customComponents.Field = !mockRSCs ? (
        <WatchCondition path={path}>
          {RenderServerComponent({
            clientProps,
            Component: fieldConfig.editor.FieldComponent,
            importMap: req.payload.importMap,
            serverProps,
          })}
        </WatchCondition>
      ) : (
        'Mock'
      )

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

          fieldState.customComponents[key] = !mockRSCs
            ? RenderServerComponent({
                clientProps,
                Component,
                importMap: req.payload.importMap,
                key: `field.admin.components.${key}`,
                serverProps,
              })
            : 'Mock'
        }
      }
      break
    }

    default: {
      break
    }
  }

  if (fieldConfig.admin) {
    if (
      'description' in fieldConfig.admin &&
      typeof fieldConfig.admin?.description === 'function'
    ) {
      fieldState.customComponents.Description = !mockRSCs ? (
        <FieldDescription
          description={fieldConfig.admin?.description({
            i18n: req.i18n,
            t: req.i18n.t,
          })}
          path={path}
        />
      ) : (
        'Mock'
      )
    }

    if (fieldConfig.admin?.components) {
      if ('afterInput' in fieldConfig.admin.components) {
        fieldState.customComponents.AfterInput = !mockRSCs
          ? RenderServerComponent({
              clientProps,
              Component: fieldConfig.admin.components.afterInput,
              importMap: req.payload.importMap,
              key: 'field.admin.components.afterInput',
              serverProps,
            })
          : 'Mock'
      }

      if ('beforeInput' in fieldConfig.admin.components) {
        fieldState.customComponents.BeforeInput = !mockRSCs
          ? RenderServerComponent({
              clientProps,
              Component: fieldConfig.admin.components.beforeInput,
              importMap: req.payload.importMap,
              key: 'field.admin.components.beforeInput',
              serverProps,
            })
          : 'Mock'
      }

      if ('Description' in fieldConfig.admin.components) {
        fieldState.customComponents.Description = !mockRSCs
          ? RenderServerComponent({
              clientProps,
              Component: fieldConfig.admin.components.Description,
              importMap: req.payload.importMap,
              key: 'field.admin.components.Description',
              serverProps,
            })
          : 'Mock'
      }

      if ('Error' in fieldConfig.admin.components) {
        fieldState.customComponents.Error = !mockRSCs
          ? RenderServerComponent({
              clientProps,
              Component: fieldConfig.admin.components.Error,
              importMap: req.payload.importMap,
              key: 'field.admin.components.Error',
              serverProps,
            })
          : 'Mock'
      }

      if ('Label' in fieldConfig.admin.components) {
        fieldState.customComponents.Label = !mockRSCs
          ? RenderServerComponent({
              clientProps,
              Component: fieldConfig.admin.components.Label,
              importMap: req.payload.importMap,
              key: 'field.admin.components.Label',
              serverProps,
            })
          : 'Mock'
      }

      if ('Field' in fieldConfig.admin.components) {
        fieldState.customComponents.Field = !mockRSCs ? (
          <WatchCondition path={path}>
            {RenderServerComponent({
              clientProps,
              Component: fieldConfig.admin.components.Field,
              importMap: req.payload.importMap,
              key: 'field.admin.components.Field',
              serverProps,
            })}
          </WatchCondition>
        ) : (
          'Mock'
        )
      }
    }
  }
}
