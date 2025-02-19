'use client'
import type { PaginatedDocs, SharedListFilter } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { Fragment, useCallback, useEffect, useState } from 'react'

import type { OnConfirm } from '../ConfirmationModal/index.js'

import { Dots } from '../../icons/Dots/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { Pill } from '../Pill/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

const baseClass = 'shared-list-filters'

const confirmDeleteModalSlug = 'confirm-delete-filter'

export function SharedListFilters({ filters }: { filters: PaginatedDocs<SharedListFilter> }) {
  const [selectedFilter, setSelectedFilter] = useState<SharedListFilter>()
  const [currentlyOpenDrawer, setCurrentlyOpenDrawer] = useState<number | string>(null)
  const { i18n, t } = useTranslation()
  const { openModal } = useModal()

  const [DocumentDrawer, , { openDrawer }] = useDocumentDrawer({
    id: currentlyOpenDrawer,
    collectionSlug: 'payload-list-filters',
  })

  useEffect(() => {
    if (currentlyOpenDrawer) {
      openDrawer()
    }
  }, [currentlyOpenDrawer, openDrawer])

  const handleDelete: OnConfirm = useCallback(({ closeConfirmationModal, setConfirming }) => {
    // handle delete
    setConfirming(false)
    closeConfirmationModal()
  }, [])

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
              onClick={() => setSelectedFilter(filter)}
              pillStyle={selectedFilter.id === filter.id ? 'dark' : 'light'}
            >
              {filter.title}
            </Pill>
          ))}
        </div>
        <div className={`${baseClass}__actions`}>
          <button className={`${baseClass}__actions__reset`} onClick={() => {}} type="button">
            {t('general:reset')}
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
                  <PopupList.Button onClick={() => setCurrentlyOpenDrawer(selectedFilter.id)}>
                    {t('general:edit')}
                  </PopupList.Button>
                  <PopupList.Button onClick={() => openModal(confirmDeleteModalSlug)}>
                    {t('general:delete')}
                  </PopupList.Button>
                </Fragment>
              ) : null}
            </PopupList.ButtonGroup>
          </Popup>
        </div>
      </div>
      <DocumentDrawer />
      <ConfirmationModal
        body={
          <Translation
            elements={{
              '1': ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:aboutToDelete"
            t={t}
            variables={{
              label: getTranslation(selectedFilter.title, i18n),
              title: selectedFilter?.title,
            }}
          />
        }
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={confirmDeleteModalSlug}
        onConfirm={handleDelete}
      />
    </Fragment>
  )
}
