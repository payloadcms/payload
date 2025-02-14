'use client'

import type { FolderBreadcrumb } from 'payload/shared'

import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import './index.scss'
import { Button } from '../../Button/index.js'

const baseClass = 'folderBreadcrumbs'

type Props = {
  readonly breadcrumbs: FolderBreadcrumb[]
  className?: string
}
export function FolderBreadcrumbs({ breadcrumbs, className }: Props) {
  const { setFolderID } = useFolder()

  return (
    <div className={`${baseClass} ${className || ''}`.trim()}>
      {breadcrumbs?.map((crumb, index) => (
        <div className={`${baseClass}__crumb`} key={`${index}-${crumb.name}`}>
          {index === breadcrumbs.length - 1 ? (
            crumb.name
          ) : (
            <Button
              buttonStyle="none"
              className={`${baseClass}__crumb`}
              el="button"
              onClick={() => {
                void setFolderID({ folderID: crumb.id })
              }}
            >
              {crumb.name}
            </Button>
          )}
          {breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && (
            <ChevronIcon className={`${baseClass}__crumb-chevron`} direction="right" />
          )}
        </div>
      ))}
    </div>
  )
}
