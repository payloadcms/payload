'use client'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { ThreeDotsIcon } from '../../../icons/ThreeDots/index.js'
import { Popup } from '../../Popup/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
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
  readonly isSelecting?: boolean
  readonly onClick?: (e: React.MouseEvent) => void
  readonly onKeyDown?: (e: React.KeyboardEvent) => void
  readonly PopupActions?: React.ReactNode
  readonly previewUrl?: string
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
  isSelecting = false,
  onClick,
  onKeyDown,
  PopupActions,
  previewUrl,
  title,
}: Props) {
  const { isOver, setNodeRef } = useDroppable({
    id: String(id),
    disabled,
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
    <div
      className={[
        baseClass,
        className,
        isSelected && `${baseClass}--selected`,
        isSelecting && `${baseClass}--selecting`,
        disabled && `${baseClass}--disabled`,
        isDeleting && `${baseClass}--deleting`,
        isFocused && `${baseClass}--focused`,
        isOver && `${baseClass}--over`,
        `${baseClass}--${type}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!disabled && (onClick || onKeyDown) && (
        <DraggableWithClick
          className={`${baseClass}__drag-handle`}
          id={String(id)}
          key={id}
          onClick={onClick}
          onKeyDown={onKeyDown}
          ref={ref}
        />
      )}
      {!disabled ? <div className={`${baseClass}__drop-area`} ref={setNodeRef} /> : null}

      {type === 'file' ? (
        <div className={`${baseClass}__preview-area`}>
          {previewUrl ? <Thumbnail fileSrc={previewUrl} /> : <DocumentIcon />}
        </div>
      ) : null}

      <div className={`${baseClass}__titlebar-area`}>
        <div className={`${baseClass}__icon-wrap`}>
          {type === 'file' ? <DocumentIcon /> : <FolderIcon />}
        </div>
        <p className={`${baseClass}__name`} title={title}>
          <span>{title}</span>
        </p>
        {PopupActions ? (
          <Popup
            button={<ThreeDotsIcon />}
            disabled={isSelecting}
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
