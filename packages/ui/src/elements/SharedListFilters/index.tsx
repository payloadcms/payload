'use client'
import type { PaginatedDocs, SharedListFilter } from 'payload'

import { Fragment, useEffect, useState } from 'react'

import { Dots } from '../../icons/Dots/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { Pill } from '../Pill/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'shared-list-filters'

export function SharedListFilters({ filters }: { filters: PaginatedDocs<SharedListFilter> }) {
  const [selectedFilter, setSelectedFilter] = useState<number | string>(null)
  const [currentlyOpenDrawer, setCurrentlyOpenDrawer] = useState<number | string>(null)
  const { t } = useTranslation()

  const [DocumentDrawer, , { openDrawer }] = useDocumentDrawer({
    id: currentlyOpenDrawer,
    collectionSlug: 'payload-list-filters',
  })

  useEffect(() => {
    if (currentlyOpenDrawer) {
      openDrawer()
    }
  }, [currentlyOpenDrawer, openDrawer])

  if (!filters) {
    return null
  }

  return (
    <Fragment>
      <div className={baseClass}>
        <div className={`${baseClass}__filters`}>
          {filters?.docs.map((filter) => (
            <Pill
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              pillStyle={selectedFilter === filter.id ? 'dark' : 'light'}
            >
              {filter.title}
            </Pill>
          ))}
        </div>
        <div className={`${baseClass}__actions`}>
          <button className={`${baseClass}__actions__reset`} onClick={() => {}} type="button">
            Reset
          </button>
          <button className={`${baseClass}__actions__save`} onClick={() => {}} type="button">
            Save For Everyone
          </button>
          <Popup
            button={<Dots ariaLabel={t('general:moreOptions')} />}
            className={`${baseClass}__popup`}
            horizontalAlign="right"
            size="large"
            verticalAlign="bottom"
          >
            <PopupList.ButtonGroup>
              {selectedFilter ? (
                <Fragment>
                  <PopupList.Button onClick={() => setCurrentlyOpenDrawer(selectedFilter)}>
                    Edit
                  </PopupList.Button>
                  <PopupList.Button onClick={() => {}}>Delete</PopupList.Button>
                </Fragment>
              ) : null}
            </PopupList.ButtonGroup>
          </Popup>
        </div>
      </div>
      <DocumentDrawer />
    </Fragment>
  )
}
