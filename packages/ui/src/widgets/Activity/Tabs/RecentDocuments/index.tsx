import React from 'react'

import type { Labels } from '../../types.js'
import type { DocumentsController } from '../../utils/useActivityDocuments.js'

import { DocumentList } from '../../components/DocumentList/index.js'
import { EmptyState } from '../../components/EmptyState/index.js'

export function RecentDocuments({
  documents,
  labels,
  listID,
}: {
  documents: DocumentsController
  labels: Labels
  listID: string
}) {
  if (!documents.items) {
    return null
  }

  return documents.items.length ? (
    <DocumentList id={listID} items={documents.items} label={labels.recents} />
  ) : (
    <EmptyState
      description={labels.recentsEmptyDescription}
      tab="recents"
      title={labels.recentsEmpty}
    />
  )
}
