import type { CollectionSlug, QueryPreset, SanitizedCollectionPermission } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { transformColumnsToPreferences, transformColumnsToSearchParams } from 'payload/shared'
import React, { Fragment, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../DocumentDrawer/index.js'
import { useListDrawer } from '../ListDrawer/index.js'
import { PopupList } from '../Popup/index.js'
import { PopupListGroupLabel } from '../Popup/PopupGroupLabel/index.js'
import { Translation } from '../Translation/index.js'

const confirmDeletePresetModalSlug = 'confirm-delete-preset'

const queryPresetsSlug = 'payload-query-presets'

export const useQueryPresets = ({
  activePreset,
  collectionSlug,
  queryPresetPermissions,
}: {
  activePreset: QueryPreset
  collectionSlug: CollectionSlug
  queryPresetPermissions: SanitizedCollectionPermission
}): {
  CreateNewPresetDrawer: React.ReactNode
  DeletePresetModal: React.ReactNode
  EditPresetDrawer: React.ReactNode
  hasModifiedPreset: boolean
  openPresetListDrawer: () => void
  PresetListDrawer: React.ReactNode
  queryPresetMenuItems: React.ReactNode[]
  resetPreset: () => Promise<void>
} => {
  const { modified, query, refineListData, setModified: setQueryModified } = useListQuery()

  const { i18n, t } = useTranslation()
  const { openModal } = useModal()

  const {
    config: {
      routes: { api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()

  const presetConfig = getEntityConfig({ collectionSlug: queryPresetsSlug })

  const [PresetDocumentDrawer, , { openDrawer: openDocumentDrawer }] = useDocumentDrawer({
    id: activePreset?.id,
    collectionSlug: queryPresetsSlug,
  })

  const [
    CreateNewPresetDrawer,
    ,
    { closeDrawer: closeCreateNewDrawer, openDrawer: openCreateNewDrawer },
  ] = useDocumentDrawer({
    collectionSlug: queryPresetsSlug,
  })

  const filterOptions = useMemo(
    () => ({
      'payload-query-presets': {
        relatedCollection: {
          equals: collectionSlug,
        },
      },
    }),
    [collectionSlug],
  )

  const [ListDrawer, , { closeDrawer: closeListDrawer, openDrawer: openListDrawer }] =
    useListDrawer({
      collectionSlugs: [queryPresetsSlug],
      filterOptions,
      selectedCollection: queryPresetsSlug,
    })

  const handlePresetChange = useCallback(
    async (preset: QueryPreset) => {
      await refineListData(
        {
          columns: preset.columns ? transformColumnsToSearchParams(preset.columns) : undefined,
          preset: preset.id,
          where: preset.where,
        },
        false,
      )
    },
    [refineListData],
  )

  const resetQueryPreset = useCallback(async () => {
    await refineListData(
      {
        columns: undefined,
        preset: undefined,
        where: undefined,
      },
      false,
    )
  }, [refineListData])

  const handleDeletePreset = useCallback(async () => {
    try {
      await fetch(`${apiRoute}/${queryPresetsSlug}/${activePreset.id}`, {
        method: 'DELETE',
      }).then(async (res) => {
        try {
          const json = await res.json()

          if (res.status < 400) {
            toast.success(
              t('general:titleDeleted', {
                label: getTranslation(presetConfig?.labels?.singular, i18n),
                title: activePreset.title,
              }),
            )

            await resetQueryPreset()
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
  }, [apiRoute, activePreset?.id, activePreset?.title, t, presetConfig, i18n, resetQueryPreset])

  const saveCurrentChanges = useCallback(async () => {
    try {
      await fetch(`${apiRoute}/payload-query-presets/${activePreset.id}`, {
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
  ])

  // Memoize so that components aren't re-rendered on query and column changes
  const queryPresetMenuItems = useMemo(() => {
    const menuItems: React.ReactNode[] = [
      <PopupListGroupLabel
        key="preset-group-label"
        label={getTranslation(presetConfig?.labels?.plural, i18n)}
      />,
    ]

    if (activePreset && modified) {
      menuItems.push(
        <PopupList.Button
          onClick={async () => {
            await refineListData(
              {
                columns: transformColumnsToSearchParams(activePreset.columns),
                where: activePreset.where,
              },
              false,
            )
          }}
        >
          {t('general:reset')}
        </PopupList.Button>,
      )

      if (queryPresetPermissions.update) {
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
        {t('general:createNew')}
      </PopupList.Button>,
    )

    if (activePreset && queryPresetPermissions?.delete) {
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
    queryPresetPermissions?.delete,
    queryPresetPermissions?.update,
    openCreateNewDrawer,
    openDocumentDrawer,
    openModal,
    saveCurrentChanges,
    t,
    refineListData,
    modified,
    presetConfig?.labels?.plural,
    i18n,
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
          await handlePresetChange(doc as QueryPreset)
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
              label: presetConfig?.labels?.singular,
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
          await handlePresetChange(doc as QueryPreset)
        }}
        onSave={async ({ doc }) => {
          await handlePresetChange(doc as QueryPreset)
        }}
      />
    ),
    hasModifiedPreset: modified,
    openPresetListDrawer: openListDrawer,
    PresetListDrawer: (
      <ListDrawer
        allowCreate={false}
        disableQueryPresets
        onSelect={async ({ doc }) => {
          closeListDrawer()
          await handlePresetChange(doc as QueryPreset)
        }}
      />
    ),
    queryPresetMenuItems,
    resetPreset: resetQueryPreset,
  }
}
