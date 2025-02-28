'use client'
import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { DraggableWithClick } from '../DraggableWithClick/index.js'
import { HiddenCell, TableCell, TableRow } from '../SimpleTable/index.js'
import './index.scss'

const baseClass = 'folder-file-row'
type Props = {
  readonly columns: React.ReactNode[]
  readonly disabled?: boolean
  readonly id: number | string
  readonly isDroppable?: boolean
  readonly isFocused?: boolean
  readonly isSelected?: boolean
  readonly isSelecting?: boolean
  readonly itemKey: string
  readonly onClick?: (e: React.MouseEvent) => void
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
  readonly type: 'file' | 'folder'
}
export function FolderFileRow({
  id,
  type,
  columns,
  disabled,
  isDroppable,
  isFocused,
  isSelected,
  isSelecting,
  itemKey,
  onClick,
  onKeyDown,
}: Props) {
  const enableDroppable = isDroppable && !isSelected
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      id,
      type,
    },
    disabled: !enableDroppable,
  })
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.focus()
    } else if (!isFocused && ref.current) {
      ref.current.blur()
    }

    return () => {
      if (ref.current) {
        ref.current.blur()
      }
    }
  }, [isFocused])

  return (
    <TableRow
      className={[
        baseClass,
        `${baseClass}--${type}`,
        isSelected && `${baseClass}--selected`,
        isSelecting && `${baseClass}--selecting`,
        disabled && `${baseClass}--disabled`,
        isFocused && `${baseClass}--focused`,
        isOver && `${baseClass}--over`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {columns.map((col, i) => (
        <TableCell key={i}>
          <span className={`${baseClass}__cell`}>
            {i === 0 ? type === 'folder' ? <FolderIcon /> : <DocumentIcon /> : null}
            <span className={`${baseClass}__cell-content`}>{col}</span>
          </span>
        </TableCell>
      ))}

      <HiddenCell>
        {enableDroppable ? <div className={`${baseClass}__drop-area`} ref={setNodeRef} /> : null}
        {onClick || onKeyDown ? (
          <DraggableWithClick
            className={`${baseClass}__drag-handle`}
            id={itemKey}
            key={itemKey}
            onClick={onClick}
            onKeyDown={onKeyDown}
            ref={ref}
          />
        ) : null}
        <div className={`${baseClass}__row-foreground`} />
        <div className={`${baseClass}__row-background`} />
      </HiddenCell>
    </TableRow>
  )
}
