import React, { useId } from 'react'

import type { Labels } from '../../types.js'
import type { PinnedDocumentsController } from './usePinnedDocuments.js'

import { PinIcon } from '../../../../icons/Pin/index.js'
import { DocumentList } from '../../components/DocumentList/index.js'
import { EmptyState } from '../../components/EmptyState/index.js'
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
  const emptyStateID = useId()

  if (!documents.items) {
    return null
  }

  const isEmpty = documents.totalDocs === 0
  const hasAddPinCard = canAddPin && documents.currentPage === documents.totalPages
  const isDisabled = documents.isBusy || documents.isSaving
  const picker = hasAddPinCard ? (
    <PinDocumentPicker
      collectionSlugs={pinnableCollections}
      descriptionID={isEmpty ? emptyStateID : undefined}
      isDisabled={isDisabled}
      label={labels.addPin}
      onError={documents.onPickerError}
      onSelect={(args) => void documents.onAdd(args)}
      pinsURL={pinsURL}
    />
  ) : null

  const addPinCard = picker ? (
    isEmpty ? (
      <EmptyState
        description={labels.pinnedEmptyDescription}
        descriptionID={emptyStateID}
        icon={<PinIcon />}
        title={labels.pinnedEmpty}
      >
        {picker}
      </EmptyState>
    ) : (
      <div className="activity-widget__add-pin">{picker}</div>
    )
  ) : null

  return documents.items.length || addPinCard ? (
    <DocumentList
      id={listID}
      isEmpty={isEmpty}
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
      trailingItem={addPinCard}
    />
  ) : (
    <EmptyState
      description={labels.pinnedEmptyDescription}
      icon={<PinIcon />}
      title={labels.pinnedEmpty}
    />
  )
}
