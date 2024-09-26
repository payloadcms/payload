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

import type { I18nClient } from '@payloadcms/translations'
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

  if (field.admin?.components) {
    if ('afterInput' in field.admin.components) {
      fieldSlots.AfterInput = (
        <RenderServerComponent
          Component={field.admin.components.afterInput}
          Fallback={null}
          importMap={importMap}
          key="field.admin.components.afterInput"
        />
      )
    }

    if ('beforeInput' in field.admin.components) {
      fieldSlots.BeforeInput = (
        <RenderServerComponent
          Component={field.admin.components.beforeInput}
          Fallback={null}
          importMap={importMap}
          key="field.admin.components.beforeInput"
        />
      )
    }

    if ('Description' in field.admin.components) {
      fieldSlots.Description = (
        <RenderServerComponent
          Component={field.admin.components.Description}
          Fallback={FieldDescription}
          importMap={importMap}
          key="field.admin.components.Description"
        />
      )
    }

    if ('Error' in field.admin.components) {
      fieldSlots.Error = (
        <RenderServerComponent
          Component={field.admin.components.Error}
          Fallback={null}
          importMap={importMap}
          key="field.admin.components.Error"
        />
      )
    }

    if ('Label' in field.admin.components) {
      fieldSlots.Label = (
        <RenderServerComponent
          Component={field.admin.components.Label}
          Fallback={null}
          importMap={importMap}
          key="field.admin.components.Label"
        />
      )
    }
  }

  // TODO: type this to match Client Field Props
  const clientProps = {
    ...fieldSlots,
    field: clientField,
    fieldState,
    path: fieldPath,
    permissions: fieldPermissions,
    readOnly,
    schemaPath: fieldSchemaPath,
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
