'use client'
import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { DraggableWithClick } from '../DraggableWithClick/index.js'
import { HiddenCell, TableCell } from '../SimpleTable/index.js'
import './index.scss'

const baseClass = 'draggable-table-row'
type Props = {
  readonly columns: React.ReactNode[]
  readonly disabled?: boolean
  readonly dragData?: Record<string, unknown>
  readonly id: number | string
  readonly isDroppable?: boolean
  readonly isFocused?: boolean
  readonly isSelected?: boolean
  readonly isSelecting?: boolean
  readonly itemKey: string
  readonly onClick?: (e: React.MouseEvent) => void
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
}
export function DraggableTableRow({
  id,
  columns,
  disabled = false,
  dragData,
  isDroppable: _isDroppable,
  isFocused,
  isSelected,
  isSelecting,
  itemKey,
  onClick,
  onKeyDown,
}: Props) {
  const isDroppable = !disabled && _isDroppable && !isSelected
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: dragData,
    disabled: !isDroppable,
  })
  const ref = React.useRef(null)

  React.useEffect(() => {
    const copyOfRef = ref.current
    if (isFocused && ref.current) {
      ref.current.focus()
    } else if (!isFocused && ref.current) {
      ref.current.blur()
    }

    return () => {
      if (copyOfRef) {
        copyOfRef.blur()
      }
    }
  }, [isFocused])

  return (
    <DraggableWithClick
      as="tr"
      className={[
        baseClass,
        isSelected && `${baseClass}--selected`,
        isSelecting && `${baseClass}--selecting`,
        disabled && `${baseClass}--disabled`,
        isFocused && `${baseClass}--focused`,
        isOver && `${baseClass}--over`,
      ]
        .filter(Boolean)
        .join(' ')}
      key={itemKey}
      onClick={onClick}
      onKeyDown={onKeyDown}
      ref={ref}
    >
      {columns.map((col, i) => (
        <TableCell
          className={[
            `${baseClass}__cell-content`,
            i === 0 && `${baseClass}__first-td`,
            i === columns.length - 1 && `${baseClass}__last-td`,
          ]
            .filter(Boolean)
            .join(' ')}
          key={`${itemKey}-${i}`}
        >
          {col}
        </TableCell>
      ))}

      {isDroppable ? (
        <HiddenCell>
          <div className={`${baseClass}__drop-area`} ref={setNodeRef} />
        </HiddenCell>
      ) : null}
    </DraggableWithClick>
  )
}
