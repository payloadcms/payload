import type {
  ClientComponentProps,
  ClientField,
  FieldPaths,
  PayloadComponent,
  SanitizedFieldPermissions,
  ServerComponentProps,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { createClientField, deepCopyObjectSimple, MissingEditorProp } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import type { RenderFieldMethod } from './types.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'

export const renderField: RenderFieldMethod = ({
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
  permissions: incomingPermissions,
  req,
  schemaPath,
  siblingData,
}) => {
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
    : ({} as SanitizedFieldPermissions)

  const clientProps: ClientComponentProps & Partial<FieldPaths> = {
    customComponents: fieldState?.customComponents || {},
    field: clientField,
    path,
    readOnly: permissions?.[operation]?.permission === false,
    schemaPath,
  }

  // fields with subfields
  if (['array', 'blocks', 'collapsible', 'group', 'row', 'tabs'].includes(fieldConfig.type)) {
    clientProps.indexPath = indexPath
    clientProps.parentPath = parentPath
    clientProps.parentSchemaPath = parentSchemaPath
  }

  const serverProps: ServerComponentProps = {
    clientField,
    data,
    field: fieldConfig,
    fieldSchemaMap,
    permissions,
    // TODO: Should we pass explicit values? initialValue, value, valid
    // value and initialValue should be typed
    formState,
    i18n: req.i18n,
    payload: req.payload,
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

          fieldState.customComponents.RowLabels[rowIndex] = (
            <RenderServerComponent
              clientProps={clientProps}
              Component={fieldConfig.admin.components.RowLabel}
              importMap={req.payload.importMap}
              serverProps={{
                ...serverProps,
                rowLabel: `${getTranslation(fieldConfig.labels.singular, req.i18n)} ${String(
                  rowIndex + 1,
                ).padStart(2, '0')}`,
                rowNumber: rowIndex + 1,
              }}
            />
          )
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
          clientProps={clientProps}
          Component={FieldComponent}
          Fallback={undefined}
          importMap={req.payload.importMap}
          serverProps={serverProps}
        />
      )

      break
    }

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
