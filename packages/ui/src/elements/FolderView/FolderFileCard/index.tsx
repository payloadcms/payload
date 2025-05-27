'use client'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { ThreeDotsIcon } from '../../../icons/ThreeDots/index.js'
import { Popup } from '../../Popup/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js'
import { DraggableWithClick } from '../DraggableWithClick/index.js'
import './index.scss'

const baseClass = 'folder-file-card'

type Props = {
  readonly className?: string
  readonly disabled?: boolean
  readonly id: number | string
  readonly isDeleting?: boolean
  readonly isFocused?: boolean
  readonly isSelected?: boolean
  readonly itemKey: string
  readonly onClick?: (e: React.MouseEvent) => void
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
  readonly PopupActions?: React.ReactNode
  readonly previewUrl?: string
  readonly selectedCount?: number
  readonly title: string
  readonly type: 'file' | 'folder'
}
export function FolderFileCard({
  id,
  type,
  className = '',
  disabled = false,
  isDeleting = false,
  isFocused = false,
  isSelected = false,
  itemKey,
  onClick,
  onKeyDown,
  PopupActions,
  previewUrl,
  selectedCount = 0,
  title,
}: Props) {
  const disableDrop = !id || disabled || type !== 'folder'
  const { isOver, setNodeRef } = useDroppable({
    id: itemKey,
    data: {
      id,
      type,
    },
    disabled: disableDrop,
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
    <div
      className={[
        baseClass,
        className,
        isSelected && `${baseClass}--selected`,
        disabled && `${baseClass}--disabled`,
        isDeleting && `${baseClass}--deleting`,
        isFocused && `${baseClass}--focused`,
        isOver && `${baseClass}--over`,
        `${baseClass}--${type}`,
      ]
        .filter(Boolean)
        .join(' ')}
      key={itemKey}
    >
      {!disabled && (onClick || onKeyDown) && (
        <DraggableWithClick
          className={`${baseClass}__drag-handle`}
          id={itemKey}
          key={itemKey}
          onClick={onClick}
          onKeyDown={onKeyDown}
          ref={ref}
        />
      )}
      {!disableDrop ? <div className={`${baseClass}__drop-area`} ref={setNodeRef} /> : null}

      {type === 'file' ? (
        <div className={`${baseClass}__preview-area`}>
          {previewUrl ? <Thumbnail fileSrc={previewUrl} /> : <DocumentIcon />}
        </div>
      ) : null}

      <div className={`${baseClass}__titlebar-area`}>
        <div className={`${baseClass}__icon-wrap`}>
          {type === 'file' ? <DocumentIcon /> : <ColoredFolderIcon />}
        </div>
        <p className={`${baseClass}__name`} title={title}>
          <span>{title}</span>
        </p>
        {PopupActions ? (
          <Popup
            button={<ThreeDotsIcon />}
            disabled={selectedCount > 1 || (selectedCount === 1 && !isSelected)}
            horizontalAlign="right"
            size="large"
            verticalAlign="bottom"
          >
            {PopupActions}
          </Popup>
        ) : null}
      </div>
    </div>
  )
}
