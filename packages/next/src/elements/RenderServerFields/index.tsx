import {
  ArrayField,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  ConfirmPasswordField,
  DateTimeField,
  EmailField,
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

import type { FieldTypes } from 'payload'

import React, { Fragment } from 'react'

import type { Props } from './types.js'

import { RenderServerComponent as RenderComponent } from '../RenderServerComponent/index.js'
import './index.scss'
import { RenderIfInViewport } from './RenderIfInViewport.js'

const baseClass = 'render-fields'

export { Props }

export const RenderServerFields: React.FC<Props> = (props) => {
  const {
    className,
    clientFields,
    config,
    fields,
    forceRender,
    i18n,
    importMap,
    indexPath,
    margins,
    path,
    payload,
    permissions,
    readOnly,
    schemaPath,
  } = props

  if (!fields || (Array.isArray(fields) && fields.length === 0)) {
    return null
  }

  if (fields) {
    return (
      <RenderIfInViewport
        className={[
          baseClass,
          className,
          margins && `${baseClass}--margins-${margins}`,
          margins === false && `${baseClass}--margins-none`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Fragment>
          {fields?.map((field, fieldIndex) => {
            const clientField = clientFields[fieldIndex]

            const forceRenderChildren =
              (typeof forceRender === 'number' && fieldIndex <= forceRender) || true

            const name = 'name' in field ? field.name : undefined

            const fieldPath = [path, name].filter(Boolean).join('.')
            const fieldSchemaPath = [schemaPath, name].filter(Boolean).join('.')
            const fieldPermissions = permissions?.[name]
            const fieldIndexPath =
              indexPath !== undefined ? `${indexPath}.${fieldIndex}` : `${fieldIndex}`

            if (
              fieldPermissions?.read?.permission === false ||
              ('disabled' in field.admin && field?.admin?.disabled)
            ) {
              return null
            }

            if ('fields' in field) {
              return (
                <RenderServerFields
                  className={className}
                  clientFields={'fields' in clientField && clientField?.fields}
                  config={config}
                  fields={field.fields}
                  forceRender={forceRenderChildren}
                  i18n={i18n}
                  importMap={importMap}
                  indexPath={
                    fieldIndexPath !== undefined
                      ? `${fieldIndexPath}.${fieldIndex}`
                      : `${fieldIndex}`
                  }
                  key={fieldIndex}
                  margins={margins}
                  path={fieldPath}
                  payload={payload}
                  permissions={permissions}
                  readOnly={readOnly}
                  schemaPath={fieldSchemaPath}
                />
              )
            }

            const isHidden = 'admin' in field && 'hidden' in field.admin && field.admin.hidden

            // TODO: type this to match Client Field Props
            const clientProps = {
              field: clientField,
              path: fieldPath,
              permissions: fieldPermissions,
              readOnly,
              schemaPath: fieldSchemaPath,
            }

            // TODO: type this to match Server Field Props
            const serverProps = {
              config,
              field,
              i18n,
              payload,
            }

            return (
              <RenderComponent
                clientProps={clientProps}
                Component={isHidden ? HiddenField : field.admin?.components?.Field}
                Fallback={fieldComponents?.[field?.type]}
                importMap={importMap}
                key={fieldIndex}
                serverProps={serverProps}
              />
            )
          })}
        </Fragment>
      </RenderIfInViewport>
    )
  }

  return null
}
