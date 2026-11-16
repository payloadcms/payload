'use client'

import type { Column, NestedDocRow, PaginatedDocs, Sort } from 'payload'

import React from 'react'

import { NestedDocsTreeProvider } from '../NestedDocs/index.js'
import { SelectionProvider } from '../Selection/index.js'

export function NestedDocsSelectionProvider({
  children,
  collectionSlug,
  columns,
  data,
  enabled,
  initialExpanded,
  rows,
  sort,
}: {
  children: React.ReactNode
  collectionSlug: string
  columns: Column[]
  data: PaginatedDocs
  enabled: boolean
  initialExpanded?: string[]
  rows?: Record<string, NestedDocRow>
  sort?: Sort
}) {
  return (
    <NestedDocsTreeProvider
      collectionSlug={collectionSlug}
      columns={columns}
      data={data}
      enabled={enabled}
      initialExpanded={initialExpanded}
      rows={rows}
      sort={sort}
    >
      <SelectionProvider docs={data?.docs} totalDocs={data?.totalDocs} useNestedDocsData={enabled}>
        {children}
      </SelectionProvider>
    </NestedDocsTreeProvider>
  )
}
