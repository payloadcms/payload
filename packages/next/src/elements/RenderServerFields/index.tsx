import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { fieldAffectsData } from 'payload/shared'
import React, { Fragment } from 'react'

import type { Props } from './types.js'

import './index.scss'
import { RenderServerField } from './RenderServerField.js'

export { Props }

export const RenderServerFields: React.FC<
  {
    collectionConfig?: SanitizedCollectionConfig
    globalConfig?: SanitizedGlobalConfig
  } & Props
> = (props) => {
  const {
    clientConfig,
    clientFields,
    collectionConfig,
    config,
    fields,
    formState,
    globalConfig,
    i18n,
    importMap,
    margins,
    payload,
    permissions,
  } = props

  return (
    <Fragment>
      {renderServerFields({
        clientConfig,
        clientFields,
        config,
        fields,
        formState,
        i18n,
        importMap,
        margins,
        payload,
        permissions: collectionConfig
          ? permissions?.collections?.[collectionConfig?.slug]?.fields
          : globalConfig
            ? permissions?.globals?.[globalConfig.slug]?.fields
            : undefined,
      })?.map((F) => F)}
    </Fragment>
  )
}

export const renderServerFields = (props: Props): React.ReactNode[] => {
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
    schemaPath,
  } = props

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

      const fieldPath = [path, name].filter(Boolean).join('.')

      const fieldSchemaPath = [schemaPath, name].filter(Boolean).join('.')

      return (
        <RenderServerField
          className={className}
          clientConfig={clientConfig}
          clientField={clientField}
          config={config}
          field={field}
          fieldIndexPath={fieldIndexPath}
          fieldPath={fieldPath}
          fieldPermissions={fieldPermissions}
          fieldSchemaPath={fieldSchemaPath}
          forceRender={forceRenderChildren}
          formState={formState}
          i18n={i18n}
          importMap={importMap}
          key={fieldIndex}
          margins={margins}
          path={path}
          payload={payload}
          permissions={permissions}
          renderServerFields={renderServerFields}
        />
      )
    })
  }

  return null
}
