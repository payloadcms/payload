import React, { useId } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import Plus from '../../icons/Plus'
import X from '../../icons/X'
import { useEditDepth } from '../../utilities/EditDepth'
import DraggableSortable from '../DraggableSortable'
import Pill from '../Pill'
import { useTableColumns } from '../TableColumns'
import './index.scss'

const baseClass = 'column-selector'

const ColumnSelector: React.FC<Props> = (props) => {
  const { slug } = props

  const { columns, moveColumn, toggleColumn } = useTableColumns()

  const { i18n } = useTranslation()
  const uuid = useId()
  const editDepth = useEditDepth()

  if (!columns) {
    return null
  }

  return (
    <DraggableSortable
      className={baseClass}
      ids={columns.map((col) => col.accessor)}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        moveColumn({
          fromIndex: moveFromIndex,
          toIndex: moveToIndex,
        })
      }}
    >
      {columns.map((col, i) => {
        const { name, accessor, active, label } = col

        if (col.accessor === '_select') return null

        return (
          <Pill
            alignIcon="left"
            aria-checked={active}
            className={[`${baseClass}__column`, active && `${baseClass}__column--active`]
              .filter(Boolean)
              .join(' ')}
            draggable
            icon={active ? <X /> : <Plus />}
            id={accessor}
            key={`${slug}-${col.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
            onClick={() => {
              toggleColumn(accessor)
            }}
          >
            {getTranslation(label || name, i18n)}
          </Pill>
        )
      })}
    </DraggableSortable>
  )
}

export default ColumnSelector
