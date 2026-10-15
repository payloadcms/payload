import React from 'react'

import type { Labels } from '../types.js'
import type { PinnedDocumentsController } from './usePinnedDocuments.js'

import { PinIcon } from '../../../icons/Pin/index.js'
import { DocumentList } from '../Documents/DocumentList/index.js'
import { EmptyState } from '../Documents/EmptyState/index.js'
import { PinDocumentPicker } from './PinDocumentPicker/index.js'
import './index.css'

export function PinnedDocuments({
  canAddPin,
  documents,
  labels,
  listID,
  pinnableCollections,
  pinsURL,
}: {
  canAddPin: boolean
  documents: PinnedDocumentsController
  labels: Labels
  listID: string
  pinnableCollections: string[]
  pinsURL: string
}) {
  if (!documents.items) {
    return null
  }

  const hasAddPinCard = canAddPin && documents.currentPage === documents.totalPages
  const isDisabled = documents.isBusy || documents.isSaving
  const picker = hasAddPinCard ? (
    <PinDocumentPicker
      collectionSlugs={pinnableCollections}
      isDisabled={isDisabled}
      isEmpty={documents.totalDocs === 0}
      labels={labels}
      onError={documents.onPickerError}
      onSelect={(args) => void documents.onAdd(args)}
      pinsURL={pinsURL}
    />
  ) : null

  return documents.items.length || picker ? (
    <DocumentList
      id={listID}
      isEmpty={documents.totalDocs === 0}
      items={documents.items}
      label={labels.pinned}
      renderActions={({ item }) => (
        <button
          aria-label={`${labels.removePin}: ${item.title}`}
          aria-pressed={true}
          className="activity-widget__pin"
          disabled={isDisabled}
          onClick={() => void documents.onRemove({ document: item })}
          type="button"
        >
          <span aria-hidden="true" className="activity-widget__pin-icon">
            <PinIcon isFilled />
          </span>
        </button>
      )}
      trailingItem={picker}
    />
  ) : (
    <EmptyState
      description={labels.pinnedEmptyDescription}
      icon={<PinIcon />}
      title={labels.pinnedEmpty}
    />
  )
}
