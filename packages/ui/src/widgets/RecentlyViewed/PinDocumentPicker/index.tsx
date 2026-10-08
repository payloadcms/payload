'use client'

import type { FilterOptionsResult } from 'payload'

import React, { useId, useMemo, useState } from 'react'

import type { ListDrawerProps } from '../../../elements/ListDrawer/types.js'
import type { PinnedItem } from '../recents.js'

import { Button } from '../../../elements/Button/index.js'
import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { PinIcon } from '../../../icons/Pin/index.js'
import { readPinnedPreferences } from '../pinnedPreferences.js'
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
      const pins = await readPinnedPreferences({ url: pinsURL })
      const idsByCollection = new Map<string, (number | string)[]>()

      for (const document of pins) {
        const ids = idsByCollection.get(document.collectionSlug) ?? []

        ids.push(document.id)
        idsByCollection.set(document.collectionSlug, ids)
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
    <Button
      aria-expanded={isDrawerOpen}
      aria-haspopup="dialog"
      aria-label={labels.addPin}
      buttonStyle="secondary"
      className="recents-widget__select-documents"
      extraButtonProps={{
        'aria-busy': isPreparing,
        'aria-describedby': isEmpty ? emptyStateID : undefined,
        'aria-disabled': isDisabled || isPreparing,
      }}
      margin={false}
      onClick={() => void prepareDrawer()}
      size="medium"
      type="button"
    >
      {labels.addPin}
    </Button>
  )

  return (
    <>
      {isEmpty ? (
        <div className="recents-widget__empty">
          <span
            aria-hidden="true"
            className="recents-widget__empty-icon recents-widget__empty-icon--pinned"
          >
            <PinIcon />
          </span>
          <span className="recents-widget__empty-text" id={emptyStateID}>
            <span className="recents-widget__empty-title">{labels.pinnedEmpty}</span>
            <span className="recents-widget__empty-description">
              {labels.pinnedEmptyDescription}
            </span>
          </span>
          {addPinButton}
        </div>
      ) : (
        <div className="recents-widget__add-pin">{addPinButton}</div>
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
