'use client'

import React from 'react'

import type { FolderTreeProps } from './types.js'

import { Tree } from '../Tree/index.js'

export const FolderTree: React.FC<
  {
    expandedNodes: Set<number | string>
    toggleNode: (id: number | string) => void
    useAsTitle?: string
  } & FolderTreeProps
> = ({ parentFieldName = 'parent', ...props }) => {
  return <Tree parentFieldName={parentFieldName} {...props} />
}
