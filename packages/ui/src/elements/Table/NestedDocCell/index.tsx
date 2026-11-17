'use client'

import type { NestedDocRow } from 'payload'

import React from 'react'

import { useNestedDocsTree } from '../../../providers/NestedDocs/index.js'
import { branchKey } from '../../../providers/NestedDocs/state.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { TreeItem } from '../../Tree/TreeItem/index.js'

export function NestedDocCell({
  id,
  children,
  isLastRendered,
  isPending,
  onToggle,
  parentTitle,
  row,
  title,
}: {
  children: React.ReactNode
  id: string
  isLastRendered: boolean
  isPending?: boolean
  onToggle?: () => void
  parentTitle?: string
  row: NestedDocRow
  title: string
}) {
  const { t } = useTranslation()
  const tree = useNestedDocsTree()
  const isBranchPending = isPending ?? tree?.pending.has(branchKey({ parentID: id }))

  return (
    <TreeItem
      hasChildren={row.hasChildren}
      isExpanded={row.isExpanded}
      isPending={isBranchPending}
      onToggle={onToggle ?? (tree ? () => tree.toggle({ id }) : undefined)}
      parentDescription={
        parentTitle === undefined ? undefined : `${t('general:parentDocument')}: ${parentTitle}. `
      }
      position={{
        ancestorContinues: row.ancestorContinues ?? [],
        indent: row.depth,
        isLastRendered,
        isLastSibling: row.isLastSibling,
      }}
      toggleLabel={`${t(row.isExpanded ? 'general:collapse' : 'general:expand')}: ${title}`}
    >
      {children}
    </TreeItem>
  )
}
