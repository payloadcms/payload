'use client'

import type { ClientCollectionConfig } from 'payload'

import React from 'react'

import { DrawerCloseButton } from '../DrawerCloseButton/index.js'
import { EditManyBulkUploads } from '../EditMany/index.js'
import './index.scss'

const baseClass = 'bulk-upload--drawer-header'

type Props = {
  readonly collectionConfig: ClientCollectionConfig
  readonly onClose: () => void
  readonly title: string
}
export function DrawerHeader({ collectionConfig, onClose, title }: Props) {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__title`}>
        <h2 title={title}>{title}</h2>
        <EditManyBulkUploads collection={collectionConfig} />
      </div>
      <DrawerCloseButton onClick={onClose} />
    </div>
  )
}
