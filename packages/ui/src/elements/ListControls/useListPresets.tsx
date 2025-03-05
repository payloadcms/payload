import type { CollectionSlug, ListPreset, SanitizedCollectionPermission } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { transformColumnsToPreferences, transformColumnsToSearchParams } from 'payload/shared'
import React, { Fragment, useCallback, useMemo } from 'react'
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

const listPresetsSlug = 'payload-list-presets'

export const useListPresets = ({
  activePreset,
  collectionSlug,
  listPresetPermissions,
}: {
  activePreset: ListPreset
  collectionSlug: CollectionSlug
  listPresetPermissions: SanitizedCollectionPermission
}): {
  CreateNewPresetDrawer: React.ReactNode
  DeletePresetModal: React.ReactNode
  EditPresetDrawer: React.ReactNode
  hasModifiedPreset: boolean
  listPresetMenuItems: React.ReactNode[]
  openPresetListDrawer: () => void
  PresetListDrawer: React.ReactNode
  resetPreset: () => Promise<void>
} => {
  const {
    modified: listQueryModified,
    query,
    refineListData,
    setModified: setQueryModified,
  } = useListQuery()

  const { i18n, t } = useTranslation()
  const { openModal } = useModal()

  const { modified: columnsModified, setModified: setColumnsModified } = useTableColumns()

  const hasModified = listQueryModified || columnsModified

  const {
    config: {
      routes: { api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()

  const presetConfig = getEntityConfig({ collectionSlug: listPresetsSlug })

  const [PresetDocumentDrawer, , { openDrawer: openDocumentDrawer }] = useDocumentDrawer({
    id: activePreset?.id,
    collectionSlug: listPresetsSlug,
  })

  const [
    CreateNewPresetDrawer,
    ,
    { closeDrawer: closeCreateNewDrawer, openDrawer: openCreateNewDrawer },
  ] = useDocumentDrawer({
    collectionSlug: listPresetsSlug,
  })

  const [ListDrawer, , { closeDrawer: closeListDrawer, openDrawer: openListDrawer }] =
    useListDrawer({
      collectionSlugs: [listPresetsSlug],
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
      await fetch(`${apiRoute}/${listPresetsSlug}/${activePreset.id}`, {
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

  const saveCurrentChanges = useCallback(async () => {
    try {
      await fetch(`${apiRoute}/payload-list-presets/${activePreset.id}`, {
        body: JSON.stringify({
          columns: transformColumnsToPreferences(query.columns),
          where: query.where,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      }).then(async (res) => {
        try {
          const json = await res.json()

          if (res.status < 400) {
            toast.success(
              t('general:updatedLabelSuccessfully', {
                label: getTranslation(presetConfig?.labels?.singular, i18n),
              }),
            )

            setQueryModified(false)
            setColumnsModified(false)
          } else {
            if (json.errors) {
              json.errors.forEach((error) => toast.error(error.message))
            } else {
              toast.error(t('error:unknown'))
            }
          }
        } catch (_err) {
          toast.error(t('error:unknown'))
        }
      })
    } catch (_err) {
      toast.error(t('error:unknown'))
    }
  }, [
    apiRoute,
    activePreset?.id,
    query.columns,
    query.where,
    t,
    presetConfig?.labels?.singular,
    i18n,
    setQueryModified,
    setColumnsModified,
  ])

  // Memoize so that components aren't re-rendered on query and column changes
  const listPresetMenuItems = useMemo(() => {
    const menuItems: React.ReactNode[] = []

    if (activePreset && hasModified) {
      menuItems.push(
        <PopupList.Button
          onClick={() => {
            // TODO: reset query and columns
            setQueryModified(false)
            setColumnsModified(false)
          }}
        >
          {t('general:reset')}
        </PopupList.Button>,
      )

      if (listPresetPermissions.update) {
        menuItems.push(
          <PopupList.Button
            onClick={async () => {
              await saveCurrentChanges()
            }}
          >
            {activePreset.isShared ? t('general:updateForEveryone') : t('general:save')}
          </PopupList.Button>,
        )
      }
    }

    menuItems.push(
      <PopupList.Button
        onClick={() => {
          openCreateNewDrawer()
        }}
      >
        {t('general:createNewLabel', {
          label: t('general:preset'),
        })}
      </PopupList.Button>,
    )

    if (activePreset && listPresetPermissions.delete) {
      menuItems.push(
        <Fragment>
          <PopupList.Button onClick={() => openModal(confirmDeletePresetModalSlug)}>
            {t('general:delete')}
          </PopupList.Button>
          <PopupList.Button
            onClick={() => {
              openDocumentDrawer()
            }}
          >
            {t('general:edit')}
          </PopupList.Button>
        </Fragment>,
      )
    }

    return menuItems
  }, [
    activePreset,
    hasModified,
    listPresetPermissions?.delete,
    listPresetPermissions?.update,
    openCreateNewDrawer,
    openDocumentDrawer,
    openModal,
    saveCurrentChanges,
    setColumnsModified,
    setQueryModified,
    t,
  ])

  return {
    CreateNewPresetDrawer: (
      <CreateNewPresetDrawer
        initialData={{
          columns: transformColumnsToPreferences(query.columns),
          relatedCollection: collectionSlug,
          where: query.where,
        }}
        onSave={async ({ doc }) => {
          closeCreateNewDrawer()
          await handlePresetChange(doc as ListPreset)
        }}
        redirectAfterCreate={false}
      />
    ),
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
              label: getTranslation(t('general:preset'), i18n),
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
    EditPresetDrawer: (
      <PresetDocumentDrawer
        onDelete={() => {
          // setSelectedPreset(undefined)
        }}
        onDuplicate={async ({ doc }) => {
          await handlePresetChange(doc as ListPreset)
        }}
        onSave={async ({ doc }) => {
          await handlePresetChange(doc as ListPreset)
        }}
      />
    ),
    hasModifiedPreset: hasModified,
    listPresetMenuItems,
    openPresetListDrawer: openListDrawer,
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
