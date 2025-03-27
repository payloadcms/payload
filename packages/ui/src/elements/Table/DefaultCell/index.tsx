'use client'
import type { DefaultCellComponentProps, UploadFieldClient } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsID } from 'payload/shared'
import React from 'react' // TODO: abstract this out to support all routers

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { formatAdminURL } from '../../../utilities/formatAdminURL.js'
import { getDisplayedFieldValue } from '../../../utilities/getDisplayedFieldValue.js'
import { Link } from '../../Link/index.js'
import { CodeCell } from './fields/Code/index.js'
import { cellComponents } from './fields/index.js'

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

  const collectionConfig = getEntityConfig({ collectionSlug })

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

  const displayedValue = getDisplayedFieldValue(cellData, field, i18n)

  const DefaultCellComponent: React.FC<DefaultCellComponentProps> =
    typeof cellData !== 'undefined' && cellComponents[field.type]

  let CellComponent: React.ReactNode = null

  // Handle JSX labels before using DefaultCellComponent
  if (React.isValidElement(displayedValue)) {
    CellComponent = displayedValue
  } else if (DefaultCellComponent) {
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
          {(displayedValue === '' ||
            typeof displayedValue === 'undefined' ||
            displayedValue === null) &&
            i18n.t('general:noLabel', {
              label: getTranslation(('label' in field ? field.label : null) || 'data', i18n),
            })}
          {typeof displayedValue === 'string' && displayedValue}
          {typeof displayedValue === 'number' && displayedValue}
          {typeof displayedValue === 'object' &&
            displayedValue !== null &&
            JSON.stringify(displayedValue)}
        </WrapElement>
      )
    }
  }

  if ((field.type === 'select' || field.type === 'radio') && field.options.length && cellData) {
    const classes = Array.isArray(cellData)
      ? cellData.map((value) => `selected--${value}`).join(' ')
      : `selected--${cellData}`

    const className = [wrapElementProps.className, classes].filter(Boolean).join(' ')

    return (
      <WrapElement {...wrapElementProps} className={className}>
        {CellComponent}
      </WrapElement>
    )
  }

  return <WrapElement {...wrapElementProps}>{CellComponent}</WrapElement>
}
