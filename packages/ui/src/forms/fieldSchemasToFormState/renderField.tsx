import type {
  ClientComponentProps,
  ClientField,
  FieldPermissions,
  PayloadComponent,
  ServerComponentProps,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { createClientField, deepCopyObjectSimple, MissingEditorProp } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import type { RenderFieldArgs } from './types.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { RowLabel as DefaultRowLabel } from '../../forms/RowLabel/index.js'

export const renderField = async ({
  data,
  fieldConfig,
  fieldSchemaMap,
  fieldState,
  formState,
  indexPath,
  parentPath,
  parentSchemaPath,
  path,
  permissions: incomingPermissions,
  previousFieldState,
  req,
  schemaPath,
  siblingData,
}: RenderFieldArgs): Promise<void> => {
  // TODO (ALESSIO): why are we passing the fieldConfig twice?
  // and especially, why are we deepCopyObject -here- instead of inside the createClientField func,
  // so no one screws this up in the future?
  const clientField = createClientField({
    clientField: deepCopyObjectSimple(fieldConfig) as ClientField,
    defaultIDType: req.payload.config.db.defaultIDType,
    field: fieldConfig,
    i18n: req.i18n,
  })

  const permissions = fieldAffectsData(fieldConfig)
    ? incomingPermissions?.[fieldConfig.name]
    : ({} as FieldPermissions)

  const clientProps: ClientComponentProps = {
    field: clientField,
    fieldState, // I DO NOT THINK WE SHOULD ADD FIELD STATE THIS HERE
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    readOnly: false, // @TODO fix this
    schemaPath,
  }

  // TODO: make sure we didn't lose any props from
  // the current 3.0 branch
  // - user is missing from here for example
  const serverProps: ServerComponentProps = {
    clientField,
    config: req.payload.config,
    data,
    field: fieldConfig,
    fieldSchemaMap,
    // TODO: not sure that I like how we pass the whole field state. Should we pass explicit values? initialValue, value, valid
    // value and initialValue should be typed
    fieldState,
    formState,
    i18n: req.i18n,
    payload: req.payload,
    siblingData,
    user: req.user,
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
              ? fieldConfig.label({ t: req.i18n.t })
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
              rowLabel: `${getTranslation(fieldConfig.labels.singular, req.i18n)} ${String(
                rowIndex + 1,
              ).padStart(2, '0')}`,
              rowNumber: rowIndex + 1,
            }}
            Component={fieldConfig.admin?.components?.RowLabel}
            Fallback={DefaultRowLabel}
            importMap={req.payload.importMap}
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
          importMap={req.payload.importMap}
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
                ? fieldConfig.admin?.description({ t: req.i18n.t })
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
            importMap={req.payload.importMap}
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
            importMap={req.payload.importMap}
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
            importMap={req.payload.importMap}
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
            importMap={req.payload.importMap}
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
            importMap={req.payload.importMap}
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
            importMap={req.payload.importMap}
            key="field.admin.components.Field"
            serverProps={serverProps}
          />
        )
      }
    }
  }
}
