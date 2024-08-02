'use client'
import LinkImport from 'next/link.js'
import React from 'react' // TODO: abstract this out to support all routers

import type { CellComponentProps, DefaultCellComponentProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatAdminURL } from '../../../utilities/formatAdminURL.js'
import { useTableCell } from '../TableCellProvider/index.js'
import { CodeCell } from './fields/Code/index.js'
import { cellComponents } from './fields/index.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const DefaultCell: React.FC<CellComponentProps> = (props) => {
  const {
    name,
    className: classNameFromProps,
    fieldType,
    isFieldAffectingData,
    label,
    onClick: onClickFromProps,
  } = props

  const { i18n } = useTranslation()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const cellContext = useTableCell()

  const { cellData, cellProps, columnIndex, customCellContext, rowData } = cellContext || {}

  const { className: classNameFromContext, link, onClick: onClickFromContext } = cellProps || {}

  const className = classNameFromProps || classNameFromContext

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

  if (name === 'id') {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell
          cellData={`ID: ${cellData}`}
          name={name}
          nowrap
          rowData={rowData}
          schemaPath={cellContext?.cellProps?.schemaPath}
        />
      </WrapElement>
    )
  }

  const DefaultCellComponent: React.FC<DefaultCellComponentProps> =
    typeof cellData !== 'undefined' && cellComponents[fieldType]

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
    if (customCellContext.uploadConfig && isFieldAffectingData && name === 'filename') {
      const FileCellComponent = cellComponents.File
      CellComponent = (
        <FileCellComponent
          cellData={cellData}
          customCellContext={customCellContext}
          rowData={rowData}
          {...props}
        />
      )
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {(cellData === '' || typeof cellData === 'undefined') &&
            'label' in props &&
            i18n.t('general:noLabel', {
              label: getTranslation(label || 'data', i18n),
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
