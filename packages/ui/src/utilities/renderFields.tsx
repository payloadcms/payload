import type { I18nClient } from '@payloadcms/translations'
import type {
  ArrayField as ArrayFieldT,
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  ClientGlobalConfig,
  Field,
  FieldPermissions,
  FieldRow,
  FieldSlots,
  FieldTypes,
  FormField,
  FormState,
  ImportMap,
  Operation,
  Payload,
  Row,
  SanitizedConfig,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldAffectsData } from 'payload/shared'
import React from 'react'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { ArrayField } from '../fields/Array/index.js'
import { BlocksField } from '../fields/Blocks/index.js'
import { CheckboxField } from '../fields/Checkbox/index.js'
import { CodeField } from '../fields/Code/index.js'
import { CollapsibleField } from '../fields/Collapsible/index.js'
import { ConfirmPasswordField } from '../fields/ConfirmPassword/index.js'
import { DateTimeField } from '../fields/DateTime/index.js'
import { EmailField } from '../fields/Email/index.js'
import { FieldDescription } from '../fields/FieldDescription/index.js'
import { FieldError } from '../fields/FieldError/index.js'
import { FieldLabel } from '../fields/FieldLabel/index.js'
import { GroupField } from '../fields/Group/index.js'
import { HiddenField } from '../fields/Hidden/index.js'
import { JoinField } from '../fields/Join/index.js'
import { JSONField } from '../fields/JSON/index.js'
import { NumberField } from '../fields/Number/index.js'
import { PasswordField } from '../fields/Password/index.js'
import { PointField } from '../fields/Point/index.js'
import { RadioGroupField } from '../fields/RadioGroup/index.js'
import { RelationshipField } from '../fields/Relationship/index.js'
import { RichTextField } from '../fields/RichText/index.js'
import { RowField } from '../fields/Row/index.js'
import { SelectField } from '../fields/Select/index.js'
import { TabsField } from '../fields/Tabs/index.js'
import { TextField } from '../fields/Text/index.js'
import { TextareaField } from '../fields/Textarea/index.js'
import { UIField } from '../fields/UI/index.js'
import { UploadField } from '../fields/Upload/index.js'
import { RowLabel } from '../forms/RowLabel/index.js'

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

export type RenderFieldsFn = (props: RenderFieldsArgs) => React.ReactNode[]

export type RenderFieldsClient = (
  args: Omit<RenderFieldsArgs, 'config' | 'importMap' | 'payload'>,
) => Promise<React.ReactNode[]>

export type RenderFieldFn = (
  args: {
    readonly className?: string
    readonly clientField: ClientField
    readonly config: SanitizedConfig
    readonly field: Field
    readonly forceRender?: boolean
    readonly formState: FormState
    readonly i18n: I18nClient
    readonly importMap: ImportMap
    readonly indexPath: string
    readonly margins?: 'small' | false
    readonly path: string
    readonly payload: Payload
    readonly permissions?: {
      [fieldName: string]: FieldPermissions
    }
    readonly schemaPath: string
  } & RenderFieldArgs,
) => React.ReactNode

export type RenderFieldClient = (
  args: Omit<RenderFieldArgs, 'config' | 'importMap' | 'payload'>,
) => Promise<React.ReactNode>

export type RenderFieldsArgs = {
  readonly Blocks?: React.ReactNode[]
  readonly className?: string
  readonly clientCollectionConfig?: ClientCollectionConfig
  readonly clientConfig: ClientConfig
  readonly clientFields: ClientField[]
  readonly clientGlobalConfig?: ClientGlobalConfig
  readonly config: SanitizedConfig
  readonly fields: Field[]
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  readonly forceRender?: boolean | number
  readonly formState?: FormState
  readonly i18n: I18nClient
  readonly importMap: ImportMap
  readonly indexPath?: string
  readonly margins?: 'small' | false
  readonly operation?: Operation
  readonly path?: string
  readonly payload: Payload
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly readOnly?: boolean
  readonly schemaPath?: string
}

export type RenderFieldArgs = {
  readonly className?: string
  readonly clientConfig: ClientConfig
  readonly clientField: ClientField
  readonly config: SanitizedConfig
  readonly field: Field
  readonly fieldPermissions: FieldPermissions
  readonly forceRender?: boolean
  readonly formState: FormState
  readonly i18n: I18nClient
  readonly importMap: ImportMap
  readonly indexPath: string
  readonly margins?: 'small' | false
  readonly path: string
  readonly payload: Payload
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly readOnly?: boolean
  readonly schemaPath: string
}

export type ClientSlotProps = {
  Blocks?: React.ReactNode[]
  field: ClientField
  Fields?: React.ReactNode[]
  fieldState: FormField
  path: string
  permissions: FieldPermissions
  readOnly?: boolean
  schemaPath: string
}

export type ServerSlotProps = {
  clientField: ClientField
  config: SanitizedConfig
  field: Field
  i18n: I18nClient
  indexPath: string
  payload: Payload
}

export const renderFields: RenderFieldsFn = (args) => {
  const {
    className,
    clientConfig,
    clientFields,
    config,
    fields,
    forceRender,
    formState,
    i18n,
    importMap,
    indexPath,
    margins,
    path: parentPath,
    payload,
    permissions,
    schemaPath,
  } = args

  if (!fields || (Array.isArray(fields) && fields.length === 0)) {
    return null
  }

  if (fields) {
    return fields?.map((field, fieldIndex) => {
      const clientField = clientFields[fieldIndex]

      const forceRenderChildren =
        (typeof forceRender === 'number' && fieldIndex <= forceRender) || true

      const name = 'name' in field ? field.name : undefined

      const fieldPermissions = permissions?.[name]

      if (
        fieldPermissions?.read?.permission === false ||
        (field.admin && 'disabled' in field.admin && field.admin.disabled)
      ) {
        return null
      }

      const isHidden = 'hidden' in field && field?.hidden

      const disabledFromAdmin = field?.admin && 'disabled' in field.admin && field.admin.disabled

      if (fieldAffectsData(field) && (isHidden || disabledFromAdmin)) {
        return null
      }

      const fieldIndexPath =
        indexPath !== undefined ? `${indexPath}.${fieldIndex}` : `${fieldIndex}`

      const path = [parentPath, name].filter(Boolean).join('.')

      const fieldSchemaPath = [schemaPath, name].filter(Boolean).join('.')

      return renderField({
        className,
        clientConfig,
        clientField,
        config,
        field,
        fieldPermissions,
        forceRender: forceRenderChildren,
        formState,
        i18n,
        importMap,
        indexPath: fieldIndexPath,
        margins,
        path,
        payload,
        permissions,
        schemaPath: fieldSchemaPath,
      })
    })
  }

  return null
}

export const renderFieldRows = ({
  className,
  clientConfig,
  clientField,
  clientProps,
  config,
  field,
  forceRender,
  formState,
  i18n,
  importMap,
  indexPath,
  margins,
  path,
  payload,
  permissions,
  rows,
  schemaPath,
  serverProps,
}: {
  readonly className?: string
  readonly clientConfig: ClientConfig
  readonly clientField: ClientField
  readonly clientProps?: ClientSlotProps
  readonly config: SanitizedConfig
  readonly field: ArrayFieldT
  readonly fieldState: FormField
  readonly forceRender?: boolean
  readonly formState: FormState
  readonly i18n: I18nClient
  readonly importMap: ImportMap
  readonly indexPath: string
  readonly margins?: 'small' | false
  readonly path: string
  readonly payload: Payload
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly rows: Row[]
  readonly schemaPath: string
  readonly serverProps?: ServerSlotProps
}): FieldRow[] =>
  rows?.map((row, rowIndex) => ({
    Fields: renderFields({
      className,
      clientConfig,
      clientFields: 'fields' in clientField ? clientField.fields : undefined,
      config,
      fields: field.fields,
      forceRender,
      formState,
      i18n,
      importMap,
      indexPath: `${indexPath}.${rowIndex}`,
      margins,
      path: `${path}.${rowIndex}`,
      payload,
      permissions,
      schemaPath,
    }),
    RowLabel: (
      <RenderServerComponent
        clientProps={{
          ...clientProps,
          rowLabel: `${getTranslation(field.labels.singular, i18n)} ${String(rowIndex + 1).padStart(
            2,
            '0',
          )}`,
          rowNumber: rowIndex + 1,
        }}
        Component={field.admin?.components?.RowLabel}
        Fallback={RowLabel}
        importMap={importMap}
        serverProps={serverProps}
      />
    ),
  }))

export const renderField: RenderFieldFn = (args) => {
  const {
    className,
    clientConfig,
    clientField,
    config,
    field,
    fieldPermissions,
    forceRender,
    formState,
    i18n,
    importMap,
    indexPath,
    margins,
    path,
    payload,
    permissions,
    readOnly,
    schemaPath,
  } = args
  const isHidden = 'admin' in field && 'hidden' in field.admin && field.admin.hidden

  const fieldState = formState?.[path]

  let clientProps: ClientSlotProps = {
    field: clientField,
    fieldState,
    path,
    permissions: fieldPermissions,
    readOnly,
    schemaPath,
  }

  const serverProps: ServerSlotProps = {
    clientField,
    config,
    field,
    i18n,
    indexPath,
    payload,
  }

  const fieldSlots: FieldSlots = {}

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
          path={path}
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
            serverProps={serverProps}
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
            serverProps={serverProps}
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
            serverProps={serverProps}
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
            serverProps={serverProps}
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
            serverProps={serverProps}
          />
        )
      }
    }
  }

  clientProps = {
    ...clientProps,
    ...fieldSlots,
  }

  return (
    <RenderServerComponent
      clientProps={clientProps}
      Component={isHidden ? fieldComponents.hidden : field.admin?.components?.Field}
      Fallback={fieldComponents?.[field?.type]}
      importMap={importMap}
      serverProps={serverProps}
    />
  )
}
