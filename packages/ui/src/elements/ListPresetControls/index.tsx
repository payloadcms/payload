'use client'
import type { DefaultDocumentIDType, ListPreset } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import {
  select,
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from 'payload/shared'
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

export function ListPresetControls({ activePreset }: { activePreset: ListPreset }) {
  const { i18n, t } = useTranslation()
  const { openModal } = useModal()

  const [documentEditID, setDocumentEditID] = useState<DefaultDocumentIDType>(null)

  const {
    collectionSlug,
    modified: listQueryModified,
    query,
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
      await refineListData({
        columns: transformColumnsToSearchParams(preset.columns),
        preset: preset.id,
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
          {activePreset ? (
            <div
              className={`${baseClass}__select__clear`}
              onClick={async (e) => {
                e.stopPropagation()

                await refineListData({
                  columns: undefined,
                  preset: undefined,
                  where: undefined,
                })
              }}
              onKeyDown={async (e) => {
                e.stopPropagation()

                await refineListData({
                  columns: undefined,
                  preset: undefined,
                  where: undefined,
                })
              }}
              role="button"
              tabIndex={0}
            >
              <XIcon />
            </div>
          ) : null}
          <div className={`${baseClass}__select__label`}>
            {activePreset?.title || 'Select preset'}
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
            {activePreset && hasModified ? (
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
            <PopupList.Button
              onClick={() => {
                setDocumentEditID(null)
                openEditDrawer()
              }}
            >
              Create new preset
            </PopupList.Button>
            {activePreset ? (
              <Fragment>
                <PopupList.Button onClick={() => openModal(confirmDeleteModalSlug)}>
                  {t('general:delete')}
                </PopupList.Button>

                <PopupList.Button
                  onClick={() => {
                    setDocumentEditID(select.id)
                    openEditDrawer()
                  }}
                >
                  {t('general:edit')}
                </PopupList.Button>
              </Fragment>
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
        initialData={
          !documentEditID
            ? {
                columns: transformColumnsToPreferences(query.columns),
                relatedCollection: collectionSlug,
                where: query.where,
              }
            : undefined
        }
        onDelete={() => {
          // setSelectedPreset(undefined)
        }}
        onDuplicate={async ({ doc }) => {
          await handleChange(doc as ListPreset)
        }}
        onSave={async ({ doc }) => {
          await handleChange(doc as ListPreset)
        }}
        redirectAfterCreate={false}
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
              label: getTranslation(activePreset?.title, i18n),
              title: activePreset?.title,
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
