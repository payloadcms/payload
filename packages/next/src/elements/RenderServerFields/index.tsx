import { fieldAffectsData } from 'payload/shared'
import React, { Fragment } from 'react'

import type { Props } from './types.js'

import './index.scss'
import { RenderIfInViewport } from './RenderIfInViewport.js'
import { RenderServerField } from './RenderServerField.js'

const baseClass = 'render-fields'

export { Props }

export const RenderServerFields: React.FC<Props> = (props) => {
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
              (field.admin && 'disabled' in field.admin && field.admin.disabled)
            ) {
              return null
            }

            const isHidden = 'hidden' in field && field?.hidden

            const disabledFromAdmin =
              field?.admin && 'disabled' in field.admin && field.admin.disabled

            if (fieldAffectsData(field) && (isHidden || disabledFromAdmin)) {
              return null
            }

            if ('fields' in field) {
              return (
                <RenderServerFields
                  className={className}
                  clientConfig={clientConfig}
                  clientFields={'fields' in clientField && clientField?.fields}
                  config={config}
                  fields={field.fields}
                  forceRender={forceRenderChildren}
                  formState={formState}
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

            return (
              <RenderServerField
                clientConfig={clientConfig}
                clientField={clientField}
                config={config}
                field={field}
                fieldPath={fieldPath}
                fieldPermissions={fieldPermissions}
                fieldSchemaPath={fieldSchemaPath}
                fieldState={formState[fieldPath]}
                i18n={i18n}
                importMap={importMap}
                key={fieldIndex}
                payload={payload}
              />
            )
          })}
        </Fragment>
      </RenderIfInViewport>
    )
  }

  return null
}
