'use client'

import type { Subfolder } from 'payload/shared'

import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { useFolder } from '../../providers/Folders/index.js'
import { strings } from '../../strings.js'
import { DrawerContentContainer } from '../DrawerContentContainer/index.js'
import './index.scss'

const baseClass = 'folderDrawerList'

type FolderListArgs = {
  readonly disabledFolderIDs?: (number | string)[]
  readonly folders: Subfolder[]
  readonly title?: string
}
export function FolderList({ disabledFolderIDs, folders, title }: FolderListArgs) {
  const { breadcrumbs } = useFolder()

  return (
    <div className={baseClass}>
      <DrawerContentContainer>
        {title && (
          <h3 className={`${baseClass}__listTitle`}>
            <strong>{title}</strong>
          </h3>
        )}
        <div className={`${baseClass}__folders`}>
          {folders.length > 0 ? (
            folders.map((folder) => (
              <FolderRow
                disabled={disabledFolderIDs?.includes(folder.id)}
                folder={folder}
                key={folder.id}
              />
            ))
          ) : (
            <div className={`${baseClass}__noSubfolders`}>
              No folders found in&nbsp;
              <span className={`${baseClass}__noSubfolders__folderPath`}>
                &quot;{breadcrumbs?.map(({ name }) => name).join('/')}&quot;
              </span>
            </div>
          )}
        </div>
      </DrawerContentContainer>
    </div>
  )
}

function FolderRow({ disabled, folder }: { disabled?: boolean; folder: Subfolder }) {
  const { setFolderID } = useFolder()

  const classes = [`${baseClass}__folderRow`, disabled ? `${baseClass}__folderRow--disabled` : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        void setFolderID({ folderID: folder.id })
      }}
      type="button"
    >
      <FolderIcon />
      <p className={`${baseClass}__folderName`}>{folder.name}</p>
      {folder.subfolderCount && folder.subfolderCount > 0 ? (
        <p className={`${baseClass}__folderCount`}>
          {folder.subfolderCount} {folder.subfolderCount > 1 ? strings.items : strings.item}
        </p>
      ) : null}
      {!disabled ? (
        <ChevronIcon className={`${baseClass}__subfolderChevron`} direction="right" />
      ) : null}
    </button>
  )
}
