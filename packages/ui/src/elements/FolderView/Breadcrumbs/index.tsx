'use client'

import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useFolder } from '../../../providers/Folders/index.js'
import './index.scss'

const baseClass = 'folderBreadcrumbs'

type Props = {
  onClick: (args: { folderID?: number | string }) => void
}
export function FolderBreadcrumbs({ onClick }: Props) {
  const { breadcrumbs } = useFolder()

  return (
    <div className={baseClass}>
      {breadcrumbs?.map((crumb, index) => (
        <div className={`${baseClass}__crumb`} key={`${index}-${crumb.name}`}>
          {index === breadcrumbs.length - 1 ? (
            crumb.name
          ) : (
            <button
              className={`${baseClass}__crumb-btn`}
              onClick={() => {
                onClick({ folderID: crumb.id })
              }}
              type="button"
            >
              {crumb.name}
            </button>
          )}
          {breadcrumbs.length > 0 && index !== breadcrumbs.length - 1 && (
            <ChevronIcon className={`${baseClass}__crumb-chevron`} direction="right" />
          )}
        </div>
      ))}
    </div>
  )
}
