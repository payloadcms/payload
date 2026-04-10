'use client'

import type { FolderOrDocument } from 'payload/shared'

import { useDroppable } from '@dnd-kit/core'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { DocumentIcon } from '../../../icons/Document/index.js'
import { ThreeDotsIcon } from '../../../icons/ThreeDots/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup } from '../../Popup/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import { ColoredFolderIcon } from '../ColoredFolderIcon/index.js'
import { DraggableWithClick } from '../DraggableWithClick/index.js'
import './index.scss'

const baseClass = 'folder-file-card'

type Props = {
  readonly className?: string
  readonly disabled?: boolean
  readonly folderType?: string[]
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
  folderType,
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
      folderType,
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
    <DraggableWithClick
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
      disabled={disabled || (!onClick && !onKeyDown)}
      key={itemKey}
      onClick={onClick}
      onKeyDown={onKeyDown}
      ref={ref}
    >
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
        <div className={`${baseClass}__titlebar-labels`}>
          <p className={`${baseClass}__name`} title={title}>
            <span>{title}</span>
          </p>
          {folderType && folderType.length > 0 ? (
            <AssignedCollections folderType={folderType} />
          ) : null}
        </div>
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
    </DraggableWithClick>
  )
}

function AssignedCollections({ folderType }: { folderType: string[] }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()

  const collectionsDisplayText = React.useMemo(() => {
    return folderType.reduce((acc, collection) => {
      const collectionConfig = config.collections?.find((c) => c.slug === collection)
      if (collectionConfig) {
        return [...acc, getTranslation(collectionConfig.labels.plural, i18n)]
      }
      return acc
    }, [])
  }, [folderType, config.collections, i18n])

  return (
    <p className={`${baseClass}__assigned-collections`}>
      {collectionsDisplayText.map((label, index) => (
        <span key={label}>
          {label}
          {index < folderType.length - 1 ? ', ' : ''}
        </span>
      ))}
    </p>
  )
}

type ContextCardProps = {
  readonly className?: string
  readonly index: number // todo: possibly remove
  readonly item: FolderOrDocument
  readonly type: 'file' | 'folder'
}
export function ContextFolderFileCard({ type, className, index, item }: ContextCardProps) {
  const { checkIfItemIsDisabled, focusedRowIndex, onItemClick, onItemKeyPress, selectedItemKeys } =
    useFolder()
  const isSelected = selectedItemKeys.has(item.itemKey)
  const isDisabled = checkIfItemIsDisabled(item)

  return (
    <FolderFileCard
      className={className}
      disabled={isDisabled}
      folderType={item.value.folderType || []}
      id={item.value.id}
      isFocused={focusedRowIndex === index}
      isSelected={isSelected}
      itemKey={item.itemKey}
      onClick={(event) => {
        void onItemClick({ event, index, item })
      }}
      onKeyDown={(event) => {
        void onItemKeyPress({ event, index, item })
      }}
      previewUrl={item.value.url}
      title={item.value._folderOrDocumentTitle}
      type={type}
    />
  )
}
