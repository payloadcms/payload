'use client'

import type { FolderBreadcrumb } from 'payload/shared'

import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import { Button } from '../../Button/index.js'
import './index.scss'

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
            crumb.name
          ) : (
            <DroppableBreadcrumb id={crumb.id} name={crumb.name} />
          )}
          {breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && (
            <ChevronIcon className={`${baseClass}__crumb-chevron`} direction="right" />
          )}
        </div>
      ))}
    </div>
  )
}

function DroppableBreadcrumb({ id, name }: FolderBreadcrumb) {
  const { isOver, setNodeRef } = useDroppable({
    id,
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
      {name}
    </Button>
  )
}
