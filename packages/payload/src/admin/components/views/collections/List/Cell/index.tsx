import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { CodeField } from '../../../../../../fields/config/types'
import type { CellComponentProps, Props } from './types'

import { fieldAffectsData } from '../../../../../../fields/config/types'
import { getTranslation } from '../../../../../../utilities/getTranslation'
import { useConfig } from '../../../../utilities/Config'
import RenderCustomComponent from '../../../../utilities/RenderCustomComponent'
import cellComponents from './field-types'
import CodeCell from './field-types/Code'

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

  if (field.name === 'id') {
    return (
      <WrapElement {...wrapElementProps}>
        <CodeCell
          collection={collection}
          data={`ID: ${String(cellData)}`}
          field={field as CodeField}
          nowrap
          rowData={rowData}
        />
      </WrapElement>
    )
  }

  let CellComponent: React.FC<CellComponentProps> | false =
    (cellData || typeof cellData === 'boolean') &&
    cellData !== null &&
    typeof cellData !== 'undefined' &&
    cellComponents[field.type]

  if (!CellComponent) {
    if (collection.upload && fieldAffectsData(field) && field.name === 'filename') {
      CellComponent = cellComponents.File
    } else {
      if (
        (cellData === undefined ||
          cellData === null ||
          (typeof cellData === 'string' && cellData.trim() === '')) &&
        'label' in field
      ) {
        return (
          <WrapElement {...wrapElementProps}>
            {t('noLabel', {
              label: getTranslation(
                typeof field.label === 'function' ? 'data' : field.label || 'data',
                i18n,
              ),
            })}
          </WrapElement>
        )
      } else if (['number', 'string'].includes(typeof cellData)) {
        return <WrapElement {...wrapElementProps}>{cellData}</WrapElement>
      } else if (typeof cellData === 'object') {
        return <WrapElement {...wrapElementProps}>{JSON.stringify(cellData)}</WrapElement>
      }
    }
  }

  return (
    <WrapElement {...wrapElementProps}>
      {CellComponent ? (
        <CellComponent collection={collection} data={cellData} field={field} rowData={rowData} />
      ) : null}
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
      CustomComponent={CustomCell}
      DefaultComponent={DefaultCell}
      componentProps={
        {
          cellData,
          className,
          colIndex,
          collection,
          field,
          link,
          onClick,
          rowData,
        } as Props
      }
    />
  )
}

export default Cell
