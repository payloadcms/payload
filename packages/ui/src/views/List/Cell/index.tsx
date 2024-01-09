import React from 'react'
import Link from 'next/link' // TODO: abstract this out to support all routers

import type { CodeField } from 'payload/types'
import type { CellComponentProps, CellProps } from './types'

import { fieldAffectsData } from 'payload/types'
import { getTranslation } from '@payloadcms/translations'
import { RenderCustomComponent } from '../../../elements/RenderCustomComponent'
import cellComponents from './field-types'
import CodeCell from './field-types/Code'

const DefaultCell: React.FC<CellProps> = (props) => {
  const {
    cellData,
    className,
    config,
    collectionConfig: { slug },
    collectionConfig,
    field,
    link = true,
    onClick,
    rowData: { id } = {},
    rowData,
    i18n,
  } = props

  const {
    routes: { admin },
  } = config

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    onClick?: () => void
    href?: string
    type?: 'button'
  } = {
    className,
  }

  if (link) {
    WrapElement = Link
    wrapElementProps.href = `${admin}/collections/${slug}/${id}`
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick(props)
    }
  }

  if (field.name === 'id') {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell
          config={config}
          collectionConfig={collectionConfig}
          data={`ID: ${cellData}`}
          field={field as CodeField}
          nowrap
          rowData={rowData}
          i18n={i18n}
        />
      </WrapElement>
    )
  }

  let CellComponent: React.FC<CellComponentProps> = cellData && cellComponents[field.type]

  if (!CellComponent) {
    if (collectionConfig.upload && fieldAffectsData(field) && field.name === 'filename') {
      CellComponent = cellComponents.File
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {(cellData === '' || typeof cellData === 'undefined') &&
            'label' in field &&
            typeof field.label === 'string' &&
            i18n.t('general:noLabel', {
              label: getTranslation(
                typeof field.label === 'function' ? 'data' : field.label || 'data',
                i18n,
              ),
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
      <CellComponent
        config={config}
        collectionConfig={collectionConfig}
        data={cellData}
        field={field}
        rowData={rowData}
        i18n={i18n}
      />
    </WrapElement>
  )
}

const Cell: React.FC<CellProps> = (props) => {
  const {
    cellData,
    className,
    colIndex,
    config,
    collectionConfig,
    field: { admin: { components: { Cell: CustomCell } = {} } = {} },
    field,
    link,
    onClick,
    rowData,
    i18n,
  } = props

  const componentProps: CellProps = {
    cellData,
    className,
    colIndex,
    config,
    collectionConfig,
    field,
    link,
    onClick,
    rowData,
    i18n,
  }

  return (
    <RenderCustomComponent
      CustomComponent={CustomCell}
      DefaultComponent={DefaultCell}
      componentProps={componentProps}
    />
  )
}

export default Cell
