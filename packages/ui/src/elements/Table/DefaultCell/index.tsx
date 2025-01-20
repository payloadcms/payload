'use client'
import type { ClientCollectionConfig, DefaultCellComponentProps, UploadFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import LinkImport from 'next/link.js'
import { fieldAffectsData, fieldIsID } from 'payload/shared'
import React from 'react' // TODO: abstract this out to support all routers

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatAdminURL } from '../../../utilities/formatAdminURL.js'
import { CodeCell } from './fields/Code/index.js'
import { cellComponents } from './fields/index.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const DefaultCell: React.FC<DefaultCellComponentProps> = (props) => {
  const {
    cellData,
    className: classNameFromProps,
    collectionSlug,
    field,
    field: { admin },
    link,
    onClick: onClickFromProps,
    rowData,
  } = props

  const { i18n } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const classNameFromConfigContext = admin && 'className' in admin ? admin.className : undefined

  const className =
    classNameFromProps ||
    (field.admin && 'className' in field.admin ? field.admin.className : null) ||
    classNameFromConfigContext

  const onClick = onClickFromProps

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    href?: string
    onClick?: () => void
    prefetch?: false
    type?: 'button'
  } = {
    className,
  }

  if (link) {
    wrapElementProps.prefetch = false
    WrapElement = Link
    wrapElementProps.href = collectionConfig?.slug
      ? formatAdminURL({
          adminRoute,
          path: `/collections/${collectionConfig?.slug}/${encodeURIComponent(rowData.id)}`,
        })
      : ''
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        collectionSlug: collectionConfig?.slug,
        rowData,
      })
    }
  }

  if (fieldIsID(field)) {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell
          cellData={`ID: ${cellData}`}
          collectionConfig={collectionConfig}
          collectionSlug={collectionSlug}
          field={{
            ...field,
            type: 'code',
          }}
          nowrap
          rowData={rowData}
        />
      </WrapElement>
    )
  }

  const DefaultCellComponent: React.FC<DefaultCellComponentProps> =
    typeof cellData !== 'undefined' && cellComponents[field.type]

  let CellComponent: React.ReactNode = null

  if (DefaultCellComponent) {
    CellComponent = <DefaultCellComponent cellData={cellData} rowData={rowData} {...props} />
  } else if (!DefaultCellComponent) {
    // DefaultCellComponent does not exist for certain field types like `text`
    if (
      collectionConfig?.upload &&
      fieldAffectsData(field) &&
      field.name === 'filename' &&
      field.type === 'text'
    ) {
      const FileCellComponent = cellComponents.File

      CellComponent = (
        <FileCellComponent
          cellData={cellData}
          rowData={rowData}
          {...(props as DefaultCellComponentProps<UploadFieldClient>)}
          collectionConfig={collectionConfig}
          field={field}
        />
      )
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {(cellData === '' || typeof cellData === 'undefined' || cellData === null) &&
            i18n.t('general:noLabel', {
              label: getTranslation(('label' in field ? field.label : null) || 'data', i18n),
            })}
          {typeof cellData === 'string' && cellData}
          {typeof cellData === 'number' && cellData}
          {typeof cellData === 'object' && cellData !== null && JSON.stringify(cellData)}
        </WrapElement>
      )
    }
  }

  return <WrapElement {...wrapElementProps}>{CellComponent}</WrapElement>
}
