import React from 'react'

import type { Labels } from '../../types.js'
import type { useActivityDocuments } from '../../utils/useActivityDocuments.js'

import { ClockIcon } from '../../../../icons/Clock/index.js'
import { DocumentList } from '../../components/DocumentList/index.js'
import { EmptyState } from '../../components/EmptyState/index.js'

export function RecentDocuments({
  documents,
  labels,
  listID,
}: {
  documents: ReturnType<typeof useActivityDocuments>
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
      icon={<ClockIcon />}
      title={labels.recentsEmpty}
    />
  )
}
