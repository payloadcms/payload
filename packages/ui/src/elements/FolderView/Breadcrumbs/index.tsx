'use client'

import type { FolderBreadcrumb } from 'payload/shared'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import './index.scss'

const baseClass = 'folderBreadcrumbs'

type Props = {
  readonly breadcrumbs: {
    id: null | number | string
    name: React.ReactNode | string
  }[]
  className?: string
}
export function FolderBreadcrumbs({ breadcrumbs, className }: Props) {
  return (
    <div className={`${baseClass} ${className || ''}`.trim()}>
      {breadcrumbs?.map((crumb, index) => (
        <div className={`${baseClass}__crumb`} key={index}>
          {
            <DroppableBreadcrumb className={`${baseClass}__crumb-item`} id={crumb.id}>
              {crumb.name}
            </DroppableBreadcrumb>
          }
          {breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && (
            <ChevronIcon className={`${baseClass}__crumb-chevron`} direction="right" />
          )}
        </div>
      ))}
    </div>
  )
}

export function DroppableBreadcrumb({
  id,
  children,
  className,
}: { children: React.ReactNode; className?: string } & Pick<FolderBreadcrumb, 'id'>) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: {
      id,
      type: 'folder',
    },
  })
  const { setFolderID } = useFolder()

  return (
    <button
      className={['droppable-button', className, isOver && 'droppable-button--hover']
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        void setFolderID({ folderID: id })
      }}
      ref={setNodeRef as unknown as any}
      type="button"
    >
      {children}
    </button>
  )
}
