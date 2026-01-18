'use client'

import type { FolderOrDocument } from '@ruya.sa/payload/shared'

import React from 'react'

import { ContextFolderFileCard } from '../FolderFileCard/index.js'
import './index.scss'

const baseClass = 'item-card-grid'

type ItemCardGridProps = {
  items: FolderOrDocument[]
  title?: string
} & (
  | {
      subfolderCount: number
      type: 'file'
    }
  | {
      subfolderCount?: never
      type: 'folder'
    }
)
export function ItemCardGrid({ type, items, subfolderCount, title }: ItemCardGridProps) {
  return (
    <>
      {title && <p className={`${baseClass}__title`}>{title}</p>}
      <div className={baseClass}>
        {!items || items?.length === 0
          ? null
          : items.map((item, _index) => {
              const index = _index + (subfolderCount || 0)
              const { itemKey } = item

              return <ContextFolderFileCard index={index} item={item} key={itemKey} type={type} />
            })}
      </div>
    </>
  )
}
