import { getTranslation, type I18n, type I18nClient } from '@payloadcms/translations'
import {
  type ClientBlock,
  type ClientField,
  type ClientTab,
  createClientField,
  deepCopyObjectSimple,
  type Field,
  type FieldPermissions,
  type FieldSchemaMap,
  type FormField,
  type FormState,
  type FormStateWithoutComponents,
  type Payload,
  type Permissions,
  type RenderedField,
  type SanitizedConfig,
} from 'payload'
import { fieldAffectsData } from 'payload/shared'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { FieldDescription } from '../fields/FieldDescription/index.js'
import { FieldLabel } from '../fields/FieldLabel/index.js'
import { RowLabel as DefaultRowLabel } from '../forms/RowLabel/index.js'

export type ClientComponentProps = {
  field: ClientBlock | ClientField | ClientTab
  fieldState: FormField
  path: string
  permissions: FieldPermissions
  readOnly?: boolean
  renderedBlocks?: RenderedField[]
  rowLabels?: React.ReactNode[]
  schemaPath: string
}

export type ServerComponentProps = {
  clientField: ClientBlock | ClientField | ClientTab
  config: SanitizedConfig
  field: Field
  i18n: I18nClient
  payload: Payload
}

type Args = {
  config: SanitizedConfig
  fieldSchemaMap: FieldSchemaMap
  formState: FormStateWithoutComponents
  i18n: I18n
  payload: Payload
  permissions: Permissions
}

type OutputArgs = {
  formState: FormState
} & Omit<Args, 'formState'>

export function attachComponentsToFormState(args: Args): args is OutputArgs {
  const { config, fieldSchemaMap, formState, i18n, payload, permissions } = args as OutputArgs

  Object.entries(formState).forEach(([path, fieldState]) => {
    const fieldConfig = fieldSchemaMap.get(fieldState.schemaPath.join('.'))

    if (!fieldConfig) {
      throw new Error(`Field config not found for ${fieldState.schemaPath.join('.')}`)
    }

    const clientField = createClientField({
      clientField: deepCopyObjectSimple(fieldState),
      defaultIDType: config.db.defaultIDType,
      field: fieldConfig,
      i18n,
      schemaPath: fieldState.schemaPath,
    })

    if ('type' in fieldConfig && fieldConfig.admin?.components?.Field) {
      const name = 'name' in fieldConfig ? fieldConfig.name : undefined

      const isHiddenField = 'hidden' in fieldConfig && fieldConfig?.hidden
      const disabledFromAdmin =
        fieldConfig?.admin && 'disabled' in fieldConfig.admin && fieldConfig.admin.disabled
      if (fieldAffectsData(fieldConfig) && (isHiddenField || disabledFromAdmin)) {
        delete formState[path]
        return
      }

      const fieldPermissions = permissions?.[name]
      if (
        fieldPermissions?.read?.permission === false ||
        (fieldConfig.admin && 'disabled' in fieldConfig.admin && fieldConfig.admin.disabled)
      ) {
        delete formState[path]
        return
      }

      const clientProps: ClientComponentProps = {
        field: clientField,
        fieldState,
        path: path ?? '',
        permissions: fieldPermissions,
        readOnly: false, // @TODO fix this
        schemaPath: fieldState.schemaPath.join('.'),
      }

      const serverProps: ServerComponentProps = {
        clientField,
        config,
        field: fieldConfig,
        i18n,
        payload,
      }

      if (!fieldState?.customComponents) {
        fieldState.customComponents = {}
      }

      if ('label' in fieldConfig) {
        fieldState.customComponents.Label = (
          <FieldLabel
            label={
              typeof fieldConfig.label === 'string' || typeof fieldConfig.label === 'object'
                ? fieldConfig.label
                : typeof fieldConfig.label === 'function'
                  ? fieldConfig.label({ t: i18n.t })
                  : ''
            }
            required={'required' in fieldConfig && fieldConfig.required}
          />
        )
      }

      switch (fieldConfig.type) {
        case 'array': {
          fieldState?.rows?.forEach((row, rowIndex) => {
            const RowLabel = (
              <RenderServerComponent
                clientProps={{
                  ...clientProps,
                  rowLabel: `${getTranslation(fieldConfig.labels.singular, i18n)} ${String(
                    rowIndex + 1,
                  ).padStart(2, '0')}`,
                  rowNumber: rowIndex + 1,
                }}
                Component={fieldConfig.admin?.components?.RowLabel}
                Fallback={DefaultRowLabel}
                importMap={payload.importMap}
                serverProps={serverProps}
              />
            )
            if (!clientProps.rowLabels) {
              clientProps.rowLabels = []
            }
            clientProps.rowLabels[rowIndex] = RowLabel
          })

          break
        }

        // @TODO collapsible labels?

        default: {
          break
        }
      }

      if (fieldConfig.admin) {
        if ('description' in fieldConfig.admin) {
          // @TODO move this to client, only render if it is a function
          fieldState.customComponents.Description = (
            <FieldDescription
              description={
                typeof fieldConfig.admin?.description === 'string' ||
                typeof fieldConfig.admin?.description === 'object'
                  ? fieldConfig.admin.description
                  : typeof fieldConfig.admin?.description === 'function'
                    ? fieldConfig.admin?.description({ t: i18n.t })
                    : ''
              }
              path={path}
            />
          )
        }

        if (fieldConfig.admin?.components) {
          if ('afterInput' in fieldConfig.admin.components) {
            fieldState.customComponents.AfterInput = (
              <RenderServerComponent
                clientProps={clientProps}
                Component={fieldConfig.admin.components.afterInput}
                importMap={payload.importMap}
                key="field.admin.components.afterInput"
                serverProps={serverProps}
              />
            )
          }

          if ('beforeInput' in fieldConfig.admin.components) {
            fieldState.customComponents.BeforeInput = (
              <RenderServerComponent
                clientProps={clientProps}
                Component={fieldConfig.admin.components.beforeInput}
                importMap={payload.importMap}
                key="field.admin.components.beforeInput"
                serverProps={serverProps}
              />
            )
          }

          if ('Description' in fieldConfig.admin.components) {
            fieldState.customComponents.Description = (
              <RenderServerComponent
                clientProps={clientProps}
                Component={fieldConfig.admin.components.Description}
                importMap={payload.importMap}
                key="field.admin.components.Description"
                serverProps={serverProps}
              />
            )
          }

          if ('Error' in fieldConfig.admin.components) {
            fieldState.customComponents.Error = (
              <RenderServerComponent
                clientProps={clientProps}
                Component={fieldConfig.admin.components.Error}
                importMap={payload.importMap}
                key="field.admin.components.Error"
                serverProps={serverProps}
              />
            )
          }

          if ('Label' in fieldConfig.admin.components) {
            fieldState.customComponents.Label = (
              <RenderServerComponent
                clientProps={clientProps}
                Component={fieldConfig.admin.components.Label}
                importMap={payload.importMap}
                key="field.admin.components.Label"
                serverProps={serverProps}
              />
            )
          }
        }
      }

      if (fieldConfig.admin?.components?.Field) {
        fieldState.customComponents.Field = (
          <RenderServerComponent
            clientProps={clientProps}
            Component={fieldConfig.admin.components.Field}
            importMap={payload.importMap}
            key="field.admin.components.Field"
            serverProps={serverProps}
          />
        )
      }
    }
  })
  return
}
