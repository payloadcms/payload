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
  FormState,
  ImportMap,
  Payload,
  SanitizedConfig,
} from 'payload'

import { type I18nClient } from '@payloadcms/translations'

import type { Props } from './types.js'

import { RenderServerComponent } from '../RenderServerComponent/index.js'

export const RenderServerField = (props: {
  readonly className: string
  readonly clientConfig: ClientConfig
  readonly clientField: ClientField
  readonly config: SanitizedConfig
  readonly field: Field
  readonly fieldIndexPath: string
  readonly fieldPath: string
  readonly fieldPermissions: FieldPermissions
  readonly fieldSchemaPath: string
  readonly forceRender?: boolean
  readonly formState: FormState
  readonly i18n: I18nClient
  readonly importMap: ImportMap
  readonly margins?: 'small' | false
  readonly path: string
  readonly payload: Payload
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly readOnly?: boolean
  readonly renderServerFields: (props: Props) => React.ReactNode[]
}): React.ReactNode => {
  const {
    className,
    clientConfig,
    clientField,
    config,
    field,
    fieldIndexPath,
    fieldPath,
    fieldPermissions,
    fieldSchemaPath,
    forceRender,
    formState,
    i18n,
    importMap,
    margins,
    path,
    payload,
    permissions,
    readOnly,
    renderServerFields,
  } = props

  const isHidden = 'admin' in field && 'hidden' in field.admin && field.admin.hidden

  const fieldSlots: FieldSlots = {}

  const fieldState = formState[fieldPath]

  // TODO: type this with a shared type
  let clientProps: {
    field: ClientField
    Fields: React.ReactNode[]
    fieldState: FormField
    path: string
    permissions: FieldPermissions
    readOnly?: boolean
    schemaPath: string
  } = {
    field: clientField,
    Fields: undefined,
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

  if ('fields' in field) {
    // switch to mapping based on form state, not field schema
    if (fieldState?.rows?.length > 0) {
      clientProps.Fields = fieldState.rows.map((row, rowIndex) => {
        return renderServerFields({
          className,
          clientConfig,
          clientFields: 'fields' in clientField ? clientField.fields : undefined,
          config,
          fields: field.fields,
          forceRender,
          formState,
          i18n,
          importMap,
          indexPath: `${fieldIndexPath}.${rowIndex}`,
          margins,
          path,
          payload,
          permissions,
          schemaPath: fieldSchemaPath,
        })
      })
    }
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
