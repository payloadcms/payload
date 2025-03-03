import type { CollectionSlug, DefaultDocumentIDType, ListPreset } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { transformColumnsToPreferences, transformColumnsToSearchParams } from 'payload/shared'
import { Fragment, useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTableColumns } from '../../providers/TableColumns/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { useListDrawer } from '../ListDrawer/index.js'
import { PopupList } from '../Popup/index.js'
import { Translation } from '../Translation/index.js'

const confirmDeletePresetModalSlug = 'confirm-delete-preset'

export const useListPresets = ({
  activePreset,
  collectionSlug,
}: {
  activePreset: ListPreset
  collectionSlug: CollectionSlug
}): {
  DeletePresetModal: React.ReactNode
  hasModifiedPreset: boolean
  listPresetMenuItems: React.ReactNode
  openPresetListDrawer: () => void
  PresetDocumentDrawer: React.ReactNode
  PresetListDrawer: React.ReactNode
  resetPreset: () => Promise<void>
} => {
  const { modified: listQueryModified, query, refineListData } = useListQuery()
  const { i18n, t } = useTranslation()
  const [listPresetDocumentID, setListPresetDocumentID] = useState<DefaultDocumentIDType>(null)
  const { openModal } = useModal()

  const { modified: columnsModified, setModified: setColumnsModified } = useTableColumns()

  const hasModified = listQueryModified || columnsModified

  const {
    config: {
      routes: { api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()

  const presetConfig = getEntityConfig({ collectionSlug: 'payload-list-presets' })

  const [
    PresetDocumentDrawer,
    ,
    { closeDrawer: closeListPresetDocumentDrawer, openDrawer: openListPresetDocumentDrawer },
  ] = useDocumentDrawer({
    id: listPresetDocumentID,
    collectionSlug: 'payload-list-presets',
  })

  const [ListDrawer, , { closeDrawer: closeListDrawer, openDrawer: openListDrawer }] =
    useListDrawer({
      collectionSlugs: ['payload-list-presets'],
    })

  const handlePresetChange = useCallback(
    async (preset: ListPreset) => {
      await refineListData({
        columns: preset.columns ? transformColumnsToSearchParams(preset.columns) : undefined,
        preset: preset.id,
        where: preset.where,
      })
    },
    [refineListData],
  )

  const resetListPreset = useCallback(async () => {
    await refineListData({
      columns: undefined,
      preset: undefined,
      where: undefined,
    })
  }, [refineListData])

  const handleDeletePreset = useCallback(async () => {
    try {
      await fetch(`${apiRoute}/payload-list-presets/${activePreset.id}`, {
        method: 'DELETE',
      }).then(async (res) => {
        try {
          const json = await res.json()

          if (res.status < 400) {
            toast.success(
              t('general:titleDeleted', {
                label: getTranslation(presetConfig.labels.singular, i18n),
                title: activePreset.title,
              }),
            )

            await resetListPreset()
          } else {
            if (json.errors) {
              json.errors.forEach((error) => toast.error(error.message))
            } else {
              toast.error(t('error:deletingTitle', { title: activePreset.title }))
            }
          }
        } catch (_err) {
          toast.error(t('error:deletingTitle', { title: activePreset.title }))
        }
      })
    } catch (_err) {
      toast.error(t('error:deletingTitle', { title: activePreset.title }))
    }
  }, [apiRoute, activePreset?.id, activePreset?.title, t, presetConfig, i18n, resetListPreset])

  return {
    DeletePresetModal: (
      <ConfirmationModal
        body={
          <Translation
            elements={{
              '1': ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="general:aboutToDelete"
            t={t}
            variables={{
              label: getTranslation('List Preset', i18n),
              title: activePreset?.title,
            }}
          />
        }
        confirmingLabel={t('general:deleting')}
        heading={t('general:confirmDeletion')}
        modalSlug={confirmDeletePresetModalSlug}
        onConfirm={handleDeletePreset}
      />
    ),
    hasModifiedPreset: hasModified,
    listPresetMenuItems: (
      <Fragment key="preset-menu-items">
        {activePreset && hasModified ? (
          <Fragment>
            <PopupList.Button
              onClick={() => {
                // TODO: reset query and columns
                // setQueryModified(false)
                // setColumnsModified(false)
              }}
            >
              {t('general:reset')}
            </PopupList.Button>
            <PopupList.Button
              onClick={() => {
                // TODO: save query and columns
                // setQueryModified(false)
                // setColumnsModified(false)
              }}
            >
              Save For Everyone
            </PopupList.Button>
          </Fragment>
        ) : null}
        <PopupList.Button
          onClick={() => {
            setListPresetDocumentID(null)
            openListPresetDocumentDrawer()
          }}
        >
          Create new preset
        </PopupList.Button>
        {activePreset ? (
          <Fragment>
            <PopupList.Button onClick={() => openModal(confirmDeletePresetModalSlug)}>
              {t('general:delete')}
            </PopupList.Button>
            <PopupList.Button
              onClick={() => {
                // setListPresetDocumentID(select.id)
                openListPresetDocumentDrawer()
              }}
            >
              {t('general:edit')}
            </PopupList.Button>
          </Fragment>
        ) : null}
      </Fragment>
    ),
    openPresetListDrawer: openListDrawer,
    PresetDocumentDrawer: (
      <PresetDocumentDrawer
        initialData={
          !listPresetDocumentID
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
          await handlePresetChange(doc as ListPreset)
        }}
        onSave={async ({ doc }) => {
          if (!listPresetDocumentID) {
            closeListPresetDocumentDrawer()
          }

          await handlePresetChange(doc as ListPreset)
        }}
        redirectAfterCreate={false}
      />
    ),
    PresetListDrawer: (
      <ListDrawer
        disableListPresets
        onSelect={async ({ doc }) => {
          closeListDrawer()
          await handlePresetChange(doc as ListPreset)
        }}
      />
    ),
    resetPreset: resetListPreset,
  }
}
