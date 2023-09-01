import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Props } from './types'

import { fieldAffectsData } from '../../../../../../fields/config/types'
import { getTranslation } from '../../../../../../utilities/getTranslation'
import { useConfig } from '../../../../utilities/Config'
import RenderCustomComponent from '../../../../utilities/RenderCustomComponent'
import cellComponents from './field-types'

const DefaultCell: React.FC<Props> = (props) => {
  const {
    cellData,
    className,
    collection: { slug },
    collection,
    field,
    link = true,
    onClick,
    rowData: { id } = {},
    rowData,
  } = props

  const {
    routes: { admin },
  } = useConfig()
  const { i18n, t } = useTranslation('general')

  let WrapElement: React.ComponentType<any> | string = 'span'

  const wrapElementProps: {
    className?: string
    onClick?: () => void
    to?: string
    type?: 'button'
  } = {
    className,
  }

  if (link) {
    WrapElement = Link
    wrapElementProps.to = `${admin}/collections/${slug}/${id}`
  }

  if (typeof onClick === 'function') {
    WrapElement = 'button'
    wrapElementProps.type = 'button'
    wrapElementProps.onClick = () => {
      onClick(props)
    }
  }

  let CellComponent = cellData && cellComponents[field.type]

  if (!CellComponent) {
    if (collection.upload && fieldAffectsData(field) && field.name === 'filename') {
      CellComponent = cellComponents.File
    } else {
      return (
        <WrapElement {...wrapElementProps}>
          {(cellData === '' || typeof cellData === 'undefined') &&
            'label' in field &&
            t('noLabel', {
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
      <CellComponent collection={collection} data={cellData} field={field} rowData={rowData} />
    </WrapElement>
  )
}

const Cell: React.FC<Props> = (props) => {
  const {
    cellData,
    className,
    colIndex,
    collection,
    field: { admin: { components: { Cell: CustomCell } = {} } = {} },
    field,
    link,
    onClick,
    rowData,
  } = props

  return (
    <RenderCustomComponent
      componentProps={{
        cellData,
        className,
        colIndex,
        collection,
        field,
        link,
        onClick,
        rowData,
      }}
      CustomComponent={CustomCell}
      DefaultComponent={DefaultCell}
    />
  )
}

export default Cell
