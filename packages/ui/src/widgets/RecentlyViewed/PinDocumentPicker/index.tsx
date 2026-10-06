'use client'

import type { FilterOptionsResult } from 'payload'

import * as qs from 'qs-esm'
import React, { useId, useMemo, useState } from 'react'

import type { ListDrawerProps } from '../../../elements/ListDrawer/types.js'
import type { PinnedItem } from '../recents.js'

import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { PlusIcon } from '../../../icons/Plus/index.js'
import './index.css'

export function PinDocumentPicker({
  collectionSlugs,
  isDisabled,
  isEmpty = false,
  labels,
  onError,
  onSelect,
  pinsURL,
}: {
  collectionSlugs: string[]
  isDisabled: boolean
  isEmpty?: boolean
  labels: { addPin: string; pinnedEmpty: string; pinnedEmptyDescription: string }
  onError: () => void
  onSelect: (args: { document: PinnedItem }) => void
  pinsURL: string
}) {
  const emptyStateID = useId()
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResult>({})
  const [isPreparing, setIsPreparing] = useState(false)
  const drawerOptions = useMemo(
    () => ({ collectionSlugs, filterOptions }),
    [collectionSlugs, filterOptions],
  )
  const [ListDrawer, , { closeDrawer, isDrawerOpen, openDrawer }] = useListDrawer(drawerOptions)
  const handleSelect: ListDrawerProps['onSelect'] = ({ collectionSlug, doc }) => {
    closeDrawer()
    onSelect({ document: { id: doc.id, collectionSlug } })
  }

  const prepareDrawer = async () => {
    if (isDisabled || isPreparing) {
      return
    }
    setIsPreparing(true)

    try {
      const query = qs.stringify(
        { depth: 0, limit: 0, pagination: false, select: { document: true } },
        { addQueryPrefix: true },
      )
      const response = await fetch(`${pinsURL}${query}`, { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Unable to read pins')
      }
      const pins: { docs: { document: { relationTo: string; value: number | string } }[] } =
        await response.json()
      const idsByCollection = new Map<string, (number | string)[]>()

      for (const { document } of pins.docs) {
        const ids = idsByCollection.get(document.relationTo) ?? []

        ids.push(document.value)
        idsByCollection.set(document.relationTo, ids)
      }
      setFilterOptions(
        Object.fromEntries(
          collectionSlugs.map((slug) => {
            const ids = idsByCollection.get(slug)

            return [slug, ids?.length ? { id: { not_in: ids } } : true]
          }),
        ),
      )
      openDrawer()
    } catch {
      onError()
    } finally {
      setIsPreparing(false)
    }
  }

  const addPinButton = (
    <button
      aria-busy={isPreparing}
      aria-describedby={isEmpty ? emptyStateID : undefined}
      aria-disabled={isDisabled || isPreparing}
      aria-expanded={isDrawerOpen}
      aria-haspopup="dialog"
      aria-label={labels.addPin}
      className={`recents-widget__add-pin${isEmpty ? ' recents-widget__add-pin--empty' : ''}`}
      onClick={() => void prepareDrawer()}
      type="button"
    >
      <span className="recents-widget__add-pin-label">
        <span aria-hidden="true" className="recents-widget__add-pin-icon">
          <PlusIcon />
        </span>
        <span>{labels.addPin}</span>
      </span>
    </button>
  )

  return (
    <>
      {isEmpty ? (
        <div className="recents-widget__empty">
          <span
            aria-hidden="true"
            className="recents-widget__empty-icon recents-widget__empty-icon--pinned"
          />
          <span className="recents-widget__empty-text" id={emptyStateID}>
            <span className="recents-widget__empty-title">{labels.pinnedEmpty}</span>
            <span className="recents-widget__empty-description">
              {labels.pinnedEmptyDescription}
            </span>
          </span>
          {addPinButton}
        </div>
      ) : (
        addPinButton
      )}
      <ListDrawer
        allowCreate={false}
        className="recents-widget__pin-picker"
        disableQueryPresets
        enableRowSelections={false}
        onSelect={handleSelect}
        overrideEntityVisibility={false}
      />
    </>
  )
}
