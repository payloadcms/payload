'use client'
import React from 'react'
import Link from 'next/link' // TODO: abstract this out to support all routers

import type { CodeField, CellComponentProps, CellProps } from 'payload/types'

import { fieldAffectsData } from 'payload/types'
import { getTranslation } from '@payloadcms/translations'
import cellComponents from './fields'
import { CodeCell } from './fields/Code'
import { useTranslation } from '../../../providers/Translation'
import { useConfig } from '../../../providers/Config'
import { useTableCell } from '../../../elements/Table/TableCellProvider'

export const DefaultCell: React.FC<CellProps> = (props) => {
  const { className, onClick, name, link: linkFromProps, fieldType, isFieldAffectingData } = props

  const { i18n } = useTranslation()

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const { cellData, rowData, customCellContext, columnIndex } = useTableCell()

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    onClick?: () => void
    href?: string
    type?: 'button'
  } = {
    className,
  }

  if (linkFromProps || (linkFromProps === undefined && columnIndex === 0)) {
    WrapElement = Link
    wrapElementProps.href = customCellContext?.collectionSlug
      ? `${adminRoute}/collections/${customCellContext?.collectionSlug}/${rowData.id}`
      : ''
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick(props)
    }
  }

  if (name === 'id') {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell data={`ID: ${cellData}`} nowrap />
      </WrapElement>
    )
  }

  console.log('fieldType', fieldType, cellData)
  let CellComponent: React.FC<CellComponentProps> = cellData && cellComponents[fieldType]

  if (!CellComponent) {
    if (customCellContext.isUploadCollection && isFieldAffectingData && name === 'filename') {
      CellComponent = cellComponents.File
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {/* {(cellData === '' || typeof cellData === 'undefined') &&
            'label' in field &&
            typeof field.label === 'string' &&
            i18n.t('general:noLabel', {
              label: getTranslation(
                typeof field.label === 'function' ? 'data' : field.label || 'data',
                i18n,
              ),
            })} */}
          {typeof cellData === 'string' && cellData}
          {typeof cellData === 'number' && cellData}
          {typeof cellData === 'object' && JSON.stringify(cellData)}
        </WrapElement>
      )
    }
  }

  return (
    <WrapElement {...wrapElementProps}>
      <CellComponent data={cellData} />
    </WrapElement>
  )
}
