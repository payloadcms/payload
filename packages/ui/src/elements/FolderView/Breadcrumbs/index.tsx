'use client'

import type { FolderBreadcrumb } from '@ruya.sa/payload/shared'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import './index.scss'

const baseClass = 'folderBreadcrumbs'

type Props = {
  readonly breadcrumbs: {
    id: null | number | string
    name: React.ReactNode | string
    onClick: () => void
  }[]
  className?: string
}
export function FolderBreadcrumbs({ breadcrumbs, className }: Props) {
  return (
    <div className={`${baseClass} ${className || ''}`.trim()}>
      {breadcrumbs?.map((crumb, index) => (
        <div className={`${baseClass}__crumb`} key={index}>
          {crumb.onClick ? (
            <DroppableBreadcrumb
              className={`${baseClass}__crumb-item`}
              id={crumb.id}
              onClick={crumb.onClick}
            >
              {crumb.name}
            </DroppableBreadcrumb>
          ) : (
            crumb.name
          )}
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
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick: () => void
} & Pick<FolderBreadcrumb, 'id'>) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: {
      id,
      type: 'folder',
    },
  })

  return (
    <button
      className={['droppable-button', className, isOver && 'droppable-button--hover']
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      ref={setNodeRef}
      type="button"
    >
      {children}
    </button>
  )
}
