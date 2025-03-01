'use client'
import type { ListPreset } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { select, transformColumnsToSearchParams } from 'payload/shared'
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

  const [selectedPreset, setSelectedPreset] = useState<ListPreset>(initialPreset)
  const [documentEditID, setDocumentEditID] = useState<number | string>(null)

  const {
    modified: listQueryModified,
    refineListData,
    setModified: setQueryModified,
  } = useListQuery()
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

  const handleChange = useCallback(
    async (preset: ListPreset) => {
      setSelectedPreset(preset)

      await refineListData({
        columns: transformColumnsToSearchParams(preset.columns),
        where: preset.where,
      })
    },
    [refineListData],
  )

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
          {selectedPreset ? (
            <div
              className={`${baseClass}__select__clear`}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedPreset(undefined)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                setSelectedPreset(undefined)
              }}
              role="button"
              tabIndex={0}
            >
              <XIcon />
            </div>
          ) : null}
          <div className={`${baseClass}__select__label`}>
            {selectedPreset?.title || 'Select preset'}
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
            {selectedPreset && hasModified ? (
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
            {selectedPreset ? (
              <PopupList.Button
                onClick={() => {
                  setDocumentEditID(select.id)
                  openEditDrawer()
                }}
              >
                {t('general:edit')}
              </PopupList.Button>
            ) : null}
            {selectedPreset ? (
              <PopupList.Button onClick={() => openModal(confirmDeleteModalSlug)}>
                {t('general:delete')}
              </PopupList.Button>
            ) : null}
          </PopupList.ButtonGroup>
        </Popup>
      </div>
      <ListDrawer
        disableListFilters
        onSelect={async ({ doc }) => {
          closeListDrawer()
          await handleChange(doc as ListPreset)
        }}
      />
      <DocumentDrawer
        onDelete={() => {
          setSelectedPreset(undefined)
        }}
        onDuplicate={async ({ doc }) => {
          await handleChange(doc as ListPreset)
        }}
        onSave={async ({ doc }) => {
          await handleChange(doc as ListPreset)
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
              label: getTranslation(selectedPreset?.title, i18n),
              title: selectedPreset?.title,
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
