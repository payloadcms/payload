import {
  ArrayField,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  ConfirmPasswordField,
  DateTimeField,
  EmailField,
  FieldDescription,
  FieldLabel,
  GroupField,
  HiddenField,
  JoinField,
  JSONField,
  NumberField,
  PasswordField,
  PointField,
  RadioGroupField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TabsField,
  TextareaField,
  TextField,
  UIField,
  UploadField,
} from '@payloadcms/ui'

export type FieldTypesComponents = {
  [K in 'confirmPassword' | 'hidden' | 'password' | FieldTypes]: React.FC
}

export const fieldComponents: FieldTypesComponents = {
  array: ArrayField,
  blocks: BlocksField,
  checkbox: CheckboxField,
  code: CodeField,
  collapsible: CollapsibleField,
  confirmPassword: ConfirmPasswordField,
  date: DateTimeField,
  email: EmailField,
  group: GroupField,
  hidden: HiddenField,
  join: JoinField,
  json: JSONField,
  number: NumberField,
  password: PasswordField,
  point: PointField,
  radio: RadioGroupField,
  relationship: RelationshipField,
  richText: RichTextField,
  row: RowField,
  select: SelectField,
  tabs: TabsField,
  text: TextField,
  textarea: TextareaField,
  ui: UIField,
  upload: UploadField,
}

import type {
  ClientConfig,
  ClientField,
  Field,
  FieldPermissions,
  FieldSlots,
  FieldTypes,
  FormField,
  ImportMap,
  Payload,
  SanitizedConfig,
} from 'payload'

import { type I18nClient } from '@payloadcms/translations'

import { RenderServerComponent } from '../RenderServerComponent/index.js'

export const RenderServerField = (props: {
  clientConfig: ClientConfig
  clientField: ClientField
  config: SanitizedConfig
  field: Field
  fieldPath: string
  fieldPermissions: FieldPermissions
  fieldSchemaPath: string
  fieldState: FormField
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
  readOnly?: boolean
}): React.ReactNode => {
  const {
    clientField,
    config,
    field,
    fieldPath,
    fieldPermissions,
    fieldSchemaPath,
    fieldState,
    i18n,
    importMap,
    payload,
    readOnly,
  } = props

  const isHidden = 'admin' in field && 'hidden' in field.admin && field.admin.hidden

  const fieldSlots: FieldSlots = {}

  // TODO: type this
  let clientProps = {
    field: clientField,
    fieldState,
    path: fieldPath,
    permissions: fieldPermissions,
    readOnly,
    schemaPath: fieldSchemaPath,
  }

  if ('label' in field) {
    fieldSlots.Label = (
      <FieldLabel
        label={
          typeof field.label === 'string' || typeof field.label === 'object'
            ? field.label
            : typeof field.label === 'function'
              ? field.label({ t: i18n.t })
              : ''
        }
        required={'required' in field && field.required}
      />
    )
  }

  if (field.admin) {
    if ('description' in field.admin) {
      fieldSlots.Description = (
        <FieldDescription
          description={
            typeof field.admin?.description === 'string' ||
            typeof field.admin?.description === 'object'
              ? field.admin.description
              : typeof field.admin?.description === 'function'
                ? field.admin?.description({ t: i18n.t })
                : ''
          }
          path={fieldPath}
        />
      )
    }

    if (field.admin?.components) {
      if ('afterInput' in field.admin.components) {
        fieldSlots.AfterInput = (
          <RenderServerComponent
            clientProps={clientProps}
            Component={field.admin.components.afterInput}
            importMap={importMap}
            key="field.admin.components.afterInput"
          />
        )
      }

      if ('beforeInput' in field.admin.components) {
        fieldSlots.BeforeInput = (
          <RenderServerComponent
            clientProps={clientProps}
            Component={field.admin.components.beforeInput}
            importMap={importMap}
            key="field.admin.components.beforeInput"
          />
        )
      }

      if ('Description' in field.admin.components) {
        fieldSlots.Description = (
          <RenderServerComponent
            clientProps={clientProps}
            Component={field.admin.components.Description}
            importMap={importMap}
            key="field.admin.components.Description"
          />
        )
      }

      if ('Error' in field.admin.components) {
        fieldSlots.Error = (
          <RenderServerComponent
            clientProps={clientProps}
            Component={field.admin.components.Error}
            importMap={importMap}
            key="field.admin.components.Error"
          />
        )
      }

      if ('Label' in field.admin.components) {
        fieldSlots.Label = (
          <RenderServerComponent
            clientProps={clientProps}
            Component={field.admin.components.Label}
            importMap={importMap}
            key="field.admin.components.Label"
          />
        )
      }
    }
  }

  clientProps = {
    ...clientProps,
    ...fieldSlots,
  }

  // TODO: type this to match Server Field Props
  const serverProps = {
    clientField,
    config,
    field,
    i18n,
    payload,
  }

  return (
    <RenderServerComponent
      clientProps={clientProps}
      Component={isHidden ? HiddenField : field.admin?.components?.Field}
      Fallback={fieldComponents?.[field?.type]}
      importMap={importMap}
      serverProps={serverProps}
    />
  )
}
