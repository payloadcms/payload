'use client'

import React from 'react'

import type { SelectionDocument } from '../../../../providers/DocumentSelection/types.js'

import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import {
  SelectAllStatus,
  useDocumentSelection,
} from '../../../../providers/DocumentSelection/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'

export function ContentsSelectAll({ documents }: { documents: SelectionDocument[] }) {
  const { getSelectAllStatus, isLocked, isSelected, toggleAllInCollection } = useDocumentSelection()
  const { t } = useTranslation()
  const selectable = documents.filter(
    ({ collectionSlug, document }) => !isLocked({ id: document.id, collectionSlug }),
  )
  const hasAllSelected =
    selectable.length > 0 &&
    selectable.every(({ collectionSlug, document }) =>
      isSelected({ id: document.id, collectionSlug }),
    )
  const hasSomeSelected = selectable.some(({ collectionSlug, document }) =>
    isSelected({ id: document.id, collectionSlug }),
  )

  return (
    <CheckboxInput
      aria-label={t(hasAllSelected ? 'general:deselectAllRows' : 'general:selectAllRows')}
      checked={hasAllSelected}
      className="select-all select-all__checkbox"
      onToggle={() => {
        for (const collectionSlug of new Set(selectable.map((entry) => entry.collectionSlug))) {
          if (
            !hasAllSelected &&
            getSelectAllStatus({ collectionSlug }) === SelectAllStatus.AllInPage
          ) {
            continue
          }
          toggleAllInCollection({ collectionSlug })
        }
      }}
      partialChecked={hasSomeSelected && !hasAllSelected}
      readOnly={selectable.length === 0}
      variant="muted"
    />
  )
}
