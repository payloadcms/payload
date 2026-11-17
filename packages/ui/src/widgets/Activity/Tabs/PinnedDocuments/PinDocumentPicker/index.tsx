'use client'

import type { FilterOptionsResult } from 'payload'

import React, { useMemo, useState } from 'react'

import type { ListDrawerProps } from '../../../../../elements/ListDrawer/types.js'
import type { DocumentReference } from '../../../utils/documents.js'

import { Button } from '../../../../../elements/Button/index.js'
import { useListDrawer } from '../../../../../elements/ListDrawer/index.js'
import { readPinnedPreferences } from '../preferences.js'
import './index.css'

export function PinDocumentPicker({
  collectionSlugs,
  descriptionID,
  isDisabled,
  label,
  onError,
  onSelect,
  pinsURL,
}: {
  collectionSlugs: string[]
  /** ID of the text that describes the button, when it is shown in the empty state. */
  descriptionID?: string
  isDisabled: boolean
  label: string
  onError: () => void
  onSelect: (args: { document: DocumentReference }) => void
  pinsURL: string
}) {
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

  return (
    <>
      <Button
        aria-expanded={isDrawerOpen}
        aria-haspopup="dialog"
        aria-label={label}
        buttonStyle="secondary"
        className="activity-widget__select-documents"
        extraButtonProps={{
          'aria-busy': isPreparing,
          'aria-describedby': descriptionID,
          'aria-disabled': isDisabled || isPreparing,
        }}
        margin={false}
        onClick={() => void prepareDrawer()}
        size="medium"
        type="button"
      >
        {label}
      </Button>
      <ListDrawer
        allowCreate={false}
        className="activity-widget__pin-picker"
        disableQueryPresets
        enableRowSelections={false}
        onSelect={handleSelect}
        overrideEntityVisibility={false}
      />
    </>
  )
}
