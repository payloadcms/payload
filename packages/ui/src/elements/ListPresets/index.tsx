'use client'
import type { ListPreset } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { Fragment, useCallback, useState } from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTableColumns } from '../../providers/TableColumns/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { useListDrawer } from '../ListDrawer/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { Translation } from '../Translation/index.js'
import './index.scss'

const baseClass = 'list-presets'

const confirmDeleteModalSlug = 'confirm-delete-filter'

export function ListPresets({ activePreset: initialPreset }: { activePreset: ListPreset }) {
  const { i18n, t } = useTranslation()
  const { openModal } = useModal()

  const [selectedFilter, setSelectedFilter] = useState<ListPreset>(initialPreset)
  const [documentEditID, setDocumentEditID] = useState<number | string>(null)

  const { modified: listQueryModified, setModified: setQueryModified } = useListQuery()
  const { modified: columnsModified, setModified: setColumnsModified } = useTableColumns()

  const hasModified = listQueryModified || columnsModified

  const [DocumentDrawer, , { openDrawer: openEditDrawer }] = useDocumentDrawer({
    id: documentEditID,
    collectionSlug: 'payload-list-presets',
  })

  const [ListDrawer, , { closeDrawer: closeListDrawer, openDrawer: openListDrawer }] =
    useListDrawer({
      collectionSlugs: ['payload-list-presets'],
    })

  const handleDelete = useCallback(() => {
    // handle delete
  }, [])

  return (
    <Fragment>
      <div className={baseClass}>
        <button
          className={`${baseClass}__select`}
          onClick={() => {
            openListDrawer()
          }}
          type="button"
        >
          {selectedFilter ? (
            <div
              className={`${baseClass}__select__clear`}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFilter(undefined)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                setSelectedFilter(undefined)
              }}
              role="button"
              tabIndex={0}
            >
              <XIcon />
            </div>
          ) : null}
          <div className={`${baseClass}__select__label`}>
            {selectedFilter?.title || 'Select preset'}
          </div>
        </button>
        <Popup
          button={<ChevronIcon ariaLabel={t('general:moreOptions')} direction="down" />}
          className={`${baseClass}__popup`}
          horizontalAlign="right"
          size="large"
          verticalAlign="bottom"
        >
          <PopupList.ButtonGroup>
            {selectedFilter && hasModified ? (
              <Fragment>
                <PopupList.Button
                  onClick={() => {
                    // TODO: reset query and columns
                    setQueryModified(false)
                    setColumnsModified(false)
                  }}
                >
                  {t('general:reset')}
                </PopupList.Button>
                <PopupList.Button
                  onClick={() => {
                    // TODO: save query and columns
                    setQueryModified(false)
                    setColumnsModified(false)
                  }}
                >
                  Save For Everyone
                </PopupList.Button>
              </Fragment>
            ) : null}
            <PopupList.Button onClick={() => openListDrawer()}>Create new preset</PopupList.Button>
            {selectedFilter ? (
              <PopupList.Button
                onClick={() => {
                  setDocumentEditID(selectedFilter.id)
                  openEditDrawer()
                }}
              >
                {t('general:edit')}
              </PopupList.Button>
            ) : null}
            {selectedFilter ? (
              <PopupList.Button onClick={() => openModal(confirmDeleteModalSlug)}>
                {t('general:delete')}
              </PopupList.Button>
            ) : null}
          </PopupList.ButtonGroup>
        </Popup>
      </div>
      <ListDrawer
        disableListFilters
        onSelect={({ doc }) => {
          closeListDrawer()
          setSelectedFilter(doc as ListPreset)
        }}
      />
      <DocumentDrawer
        onDelete={() => {
          setSelectedFilter(undefined)
        }}
        onDuplicate={(doc) => {
          setSelectedFilter(doc)
        }}
        onSave={(doc) => {
          setSelectedFilter(doc)
        }}
      />
      <ConfirmationModal
        body={
          <Translation
            elements={{
              '1': ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:aboutToDelete"
            t={t}
            variables={{
              label: getTranslation(selectedFilter?.title, i18n),
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
