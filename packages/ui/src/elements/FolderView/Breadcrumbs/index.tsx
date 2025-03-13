'use client'

import type { FolderBreadcrumb } from 'payload/shared'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import './index.scss'
import { Button } from '../../Button/index.js'

const baseClass = 'folderBreadcrumbs'

type Props = {
  readonly breadcrumbs: FolderBreadcrumb[]
  className?: string
}
export function FolderBreadcrumbs({ breadcrumbs, className }: Props) {
  return (
    <div className={`${baseClass} ${className || ''}`.trim()}>
      {breadcrumbs?.map((crumb, index) => (
        <div className={`${baseClass}__crumb`} key={`${index}-${crumb.name}`}>
          {index === breadcrumbs.length - 1 ? (
            crumb?.root ? (
              <FolderIcon />
            ) : (
              crumb.name
            )
          ) : (
            <DroppableBreadcrumb id={crumb.id}>
              {crumb?.root ? <FolderIcon /> : crumb.name}
            </DroppableBreadcrumb>
          )}
          {breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && (
            <ChevronIcon className={`${baseClass}__crumb-chevron`} direction="right" />
          )}
        </div>
      ))}
    </div>
  )
}

function DroppableBreadcrumb({
  id,
  children,
}: { children: React.ReactNode } & Pick<FolderBreadcrumb, 'id'>) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${id}`,
    data: {
      id,
      type: 'folder',
    },
  })
  const { setFolderID } = useFolder()

  return (
    <Button
      buttonStyle="none"
      className={[`${baseClass}__crumb-item`, isOver && `${baseClass}__crumb-item--over`]
        .filter(Boolean)
        .join(' ')}
      el="button"
      onClick={() => {
        void setFolderID({ folderID: id })
      }}
      ref={setNodeRef as unknown as any}
    >
      {children}
    </Button>
  )
}
