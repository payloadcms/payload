'use client'
import LinkImport from 'next/link.js'
import React from 'react' // TODO: abstract this out to support all routers

import type {
  CellComponentProps,
  CodeFieldClient,
  DefaultCellComponentProps,
  UploadFieldClient,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldAffectsData } from 'payload/shared'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatAdminURL } from '../../../utilities/formatAdminURL.js'
import { useTableCell } from '../TableCellProvider/index.js'
import { CodeCell } from './fields/Code/index.js'
import { cellComponents } from './fields/index.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const DefaultCell: React.FC<CellComponentProps> = (props) => {
  const { className: classNameFromProps, field, onClick: onClickFromProps } = props

  const { i18n } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const cellContext = useTableCell()

  const { cellData, cellProps, columnIndex, customCellContext, rowData } = cellContext || {}

  const {
    className: classNameFromContext,
    field: { admin },
    link,
    onClick: onClickFromContext,
  } = cellProps || {}

  const classNameFromConfigContext = 'className' in admin ? admin.className : undefined

  const className =
    classNameFromProps ||
    (field.admin && 'className' in field.admin ? field.admin.className : null) ||
    classNameFromContext ||
    classNameFromConfigContext

  const onClick = onClickFromProps || onClickFromContext

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    href?: string
    onClick?: () => void
    type?: 'button'
  } = {
    className,
  }

  const isLink = link !== undefined ? link : columnIndex === 0

  if (isLink) {
    WrapElement = Link
    wrapElementProps.href = customCellContext?.collectionSlug
      ? formatAdminURL({
          adminRoute,
          path: `/collections/${customCellContext?.collectionSlug}/${rowData.id}`,
        })
      : ''
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        collectionSlug: customCellContext?.collectionSlug,
        rowData,
      })
    }
  }

  if ('name' in field && field.name === 'id') {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell
          cellData={`ID: ${cellData}`}
          field={{
            ...(field as CodeFieldClient),
            _schemaPath: cellContext?.cellProps?.field?._schemaPath,
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
    CellComponent = (
      <DefaultCellComponent
        cellData={cellData}
        customCellContext={customCellContext}
        rowData={rowData}
        {...props}
      />
    )
  } else if (!DefaultCellComponent) {
    // DefaultCellComponent does not exist for certain field types like `text`
    if (customCellContext.uploadConfig && fieldAffectsData(field) && field.name === 'filename') {
      const FileCellComponent = cellComponents.File
      CellComponent = (
        <FileCellComponent
          cellData={cellData}
          customCellContext={customCellContext}
          rowData={rowData}
          {...(props as CellComponentProps<UploadFieldClient>)}
        />
      )
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {(cellData === '' || typeof cellData === 'undefined') &&
            i18n.t('general:noLabel', {
              label: getTranslation(('label' in field ? field.label : null) || 'data', i18n),
            })}
          {typeof cellData === 'string' && cellData}
          {typeof cellData === 'number' && cellData}
          {typeof cellData === 'object' && JSON.stringify(cellData)}
        </WrapElement>
      )
    }
  }

  return <WrapElement {...wrapElementProps}>{CellComponent}</WrapElement>
}
