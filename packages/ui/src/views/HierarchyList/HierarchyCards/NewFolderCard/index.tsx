'use client'

import React from 'react'

import type { CollectionOption } from '../../../../elements/CreateDocumentButton/index.js'

import { CreateDocumentButton } from '../../../../elements/CreateDocumentButton/index.js'
import './index.css'

const baseClass = 'new-folder-card'

/**
 * Dashed-outline counterpart to `FolderCard` that opens the folder create drawer. It sits as the
 * last cell of the folders band, so creating a folder happens where the folders already are rather
 * than in the toolbar.
 */
export const NewFolderCard: React.FC<{
  collections: CollectionOption[]
  drawerSlug: string
  onSave?: () => void
}> = ({ collections, drawerSlug, onSave }) => (
  <div className={baseClass}>
    <CreateDocumentButton
      buttonStyle="dashed"
      className={`${baseClass}__button`}
      collections={collections}
      drawerSlug={drawerSlug}
      icon={['plus']}
      label="New Folder"
      onSave={onSave}
    />
  </div>
)
