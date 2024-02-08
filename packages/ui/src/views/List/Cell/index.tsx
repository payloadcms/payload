'use client'
import React from 'react'
import Link from 'next/link' // TODO: abstract this out to support all routers

import type { CellComponentProps, CellProps } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import cellComponents from './fields'
import { CodeCell } from './fields/Code'
import { useTranslation } from '../../../providers/Translation'
import { useConfig } from '../../../providers/Config'
import { useTableCell } from '../../../elements/Table/TableCellProvider'

export const DefaultCell: React.FC<CellProps> = (props) => {
  const {
    className: classNameFromProps,
    name,
    fieldType,
    isFieldAffectingData,
    label,
    onClick: onClickFromProps,
  } = props

  const { i18n } = useTranslation()

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const cellContext = useTableCell()

  const { cellData, rowData, customCellContext, columnIndex, cellProps } = cellContext || {}

  const { link, onClick: onClickFromContext, className: classNameFromContext } = cellProps || {}

  const className = classNameFromProps || classNameFromContext

  const onClick = onClickFromProps || onClickFromContext

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    onClick?: () => void
    href?: string
    type?: 'button'
  } = {
    className,
  }

  const isLink = link !== undefined ? link : columnIndex === 0

  if (isLink) {
    WrapElement = Link
    wrapElementProps.href = customCellContext?.collectionSlug
      ? `${adminRoute}/collections/${customCellContext?.collectionSlug}/${rowData.id}`
      : ''
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick({
        cellData,
        rowData,
        collectionSlug: customCellContext?.collectionSlug,
      })
    }
  }

  if (name === 'id') {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell cellData={`ID: ${cellData}`} nowrap />
      </WrapElement>
    )
  }

  let CellComponent: React.FC<CellComponentProps> = cellData && cellComponents[fieldType]

  if (!CellComponent) {
    if (customCellContext.uploadConfig && isFieldAffectingData && name === 'filename') {
      CellComponent = cellComponents.File
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {(cellData === '' || typeof cellData === 'undefined') &&
            label &&
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

  return (
    <WrapElement {...wrapElementProps}>
      <CellComponent cellData={cellData} rowData={rowData} customCellContext={customCellContext} />
    </WrapElement>
  )
}
