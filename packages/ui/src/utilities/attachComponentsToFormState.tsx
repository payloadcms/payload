import { getTranslation, type I18n } from '@payloadcms/translations'
import {
  type ClientComponentProps,
  createClientField,
  deepCopyObjectSimple,
  type FieldSchemaMap,
  type FormState,
  type FormStateWithoutComponents,
  MissingEditorProp,
  type Payload,
  type PayloadComponent,
  type Permissions,
  type SanitizedConfig,
  type ServerComponentProps,
} from 'payload'
import { fieldAffectsData } from 'payload/shared'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { FieldDescription } from '../fields/FieldDescription/index.js'
import { FieldLabel } from '../fields/FieldLabel/index.js'
import { RowLabel as DefaultRowLabel } from '../forms/RowLabel/index.js'

type Args = {
  config: SanitizedConfig
  fieldSchemaMap: FieldSchemaMap
  formState: FormStateWithoutComponents
  i18n: I18n
  payload: Payload
  permissions: Permissions
  /**
   * If passed, only fields with these schema paths will be handled by this function.
   */
  schemaPathsToRender?: string[]
}

type OutputArgs = {
  formState: FormState
} & Omit<Args, 'formState'>

export function attachComponentsToFormState(args: Args): args is OutputArgs {
  const { config, fieldSchemaMap, formState, i18n, payload, permissions, schemaPathsToRender } =
    args as OutputArgs

  if (
    schemaPathsToRender !== undefined &&
    schemaPathsToRender !== null &&
    schemaPathsToRender.length === 0
  ) {
    return
  }

  Object.entries(formState).forEach(([path, fieldState]) => {
    const schemaPathString = fieldState?.schemaPath?.join('.')
    if (
      !schemaPathString ||
      (schemaPathsToRender &&
        schemaPathsToRender.length > 0 &&
        !schemaPathsToRender.includes(schemaPathString))
    ) {
      return
    }

    const fieldConfig = fieldSchemaMap.get(schemaPathString)

    if (!fieldConfig) {
      // blockType is not an actual field so it wont exist in the fieldSchemaMap
      if (fieldState.schemaPath[fieldState.schemaPath.length - 1] === 'blockType') {
        return
      } else {
        throw new Error(`Field config not found for ${schemaPathString}`)
      }
    }

    const clientField = createClientField({
      clientField: deepCopyObjectSimple({
        _schemaPath: fieldState.schemaPath,
        ...fieldConfig,
      }),
      defaultIDType: config.db.defaultIDType,
      field: fieldConfig,
      i18n,
      schemaPath: fieldState.schemaPath,
    })

    if ('type' in fieldConfig) {
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
        schemaPath: schemaPathString,
      }

      const serverProps: ServerComponentProps = {
        config,
        fieldSchemaMap,
        formState,
        i18n,
        payload,
        serverField: fieldConfig,
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

          /**
           * We have to deep copy all the props we send to the client (= FieldComponent.clientProps).
           * That way, every editor's field / cell props we send to the client have their own object references.
           *
           * If we send the same object reference to the client twice (e.g. through some configurations where 2 or more fields
           * reference the same editor object, like the root editor), the admin panel may hang indefinitely. This has been happening since
           * a newer Next.js update that made it break when sending the same object reference to the client twice.
           *
           * We can use deepCopyObjectSimple as client props should be JSON-serializable.
           */
          const FieldComponent: PayloadComponent = fieldConfig.editor.FieldComponent
          if (typeof FieldComponent === 'object' && FieldComponent.clientProps) {
            FieldComponent.clientProps = deepCopyObjectSimple(FieldComponent.clientProps)
          }

          fieldState.customComponents.Field = (
            <RenderServerComponent
              clientProps={{
                ...clientProps,
              }}
              Component={FieldComponent}
              Fallback={undefined}
              importMap={payload.importMap}
              serverProps={serverProps}
            />
          )

          const CellComponent: PayloadComponent = fieldConfig.editor.CellComponent
          if (typeof CellComponent === 'object' && CellComponent.clientProps) {
            CellComponent.clientProps = deepCopyObjectSimple(CellComponent.clientProps)
          }

          // TODO: Move to wherever Jacob handles table cell components
          fieldState.customComponents.Cell = (
            <RenderServerComponent
              clientProps={{
                ...clientProps,
              }}
              Component={CellComponent}
              Fallback={undefined}
              importMap={payload.importMap}
              serverProps={serverProps}
            />
          )

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

          if ('Field' in fieldConfig.admin.components) {
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
      }
    }
  })

  return
}
