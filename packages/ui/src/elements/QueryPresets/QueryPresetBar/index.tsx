import type { QueryPreset, SanitizedCollectionPermission } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import {
  formatAdminURL,
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from 'payload/shared'
import React, { Fragment, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { PlusIcon } from '../../../icons/Plus/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useListQuery } from '../../../providers/ListQuery/context.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ConfirmationModal } from '../../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { useListDrawer } from '../../ListDrawer/index.js'
import { ListSelectionButton } from '../../ListSelection/index.js'
import { Pill } from '../../Pill/index.js'
import { Translation } from '../../Translation/index.js'
import { QueryPresetToggler } from '../QueryPresetToggler/index.js'
import './index.scss'

const confirmDeletePresetModalSlug = 'confirm-delete-preset'

const queryPresetsSlug = 'payload-query-presets'

const baseClass = 'query-preset-bar'

export const QueryPresetBar: React.FC<{
  activePreset: QueryPreset
  collectionSlug?: string
  queryPresetPermissions: SanitizedCollectionPermission
}> = ({ activePreset, collectionSlug, queryPresetPermissions }) => {
  const { modified, query, setQuery, setModified: setQueryModified } = useListQuery()

  const { i18n, t } = useTranslation()
  const { openModal } = useModal()

  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
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
        isTemp: {
          not_equals: true,
        },
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
    (preset: QueryPreset) => {
      setQuery({
        columns: preset.columns ? transformColumnsToSearchParams(preset.columns) : null,
        groupBy: preset.groupBy || null,
        preset: preset.id,
        where: preset.where,
      })
      // When applying a preset, the query now matches the preset - not modified
      setQueryModified(false)
    },
    [setQuery, setQueryModified],
  )

  const resetQueryPreset = useCallback(() => {
    setQuery({
      columns: null,
      groupBy: null,
      preset: null,
      where: null,
    })
    // When clearing a preset, there's nothing to be modified from
    setQueryModified(false)
  }, [setQuery, setQueryModified])

  const handleDeletePreset = useCallback(async () => {
    try {
      await fetch(
        formatAdminURL({
          apiRoute,
          path: `/${queryPresetsSlug}/${activePreset.id}`,
        }),
        {
          method: 'DELETE',
        },
      ).then(async (res) => {
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
      await fetch(
        formatAdminURL({
          apiRoute,
          path: `/${queryPresetsSlug}/${activePreset.id}`,
        }),
        {
          body: JSON.stringify({
            columns: transformColumnsToPreferences(query.columns),
            groupBy: query.groupBy,
            where: query.where,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        },
      ).then(async (res) => {
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
    query.groupBy,
    query.where,
    t,
    presetConfig?.labels?.singular,
    i18n,
    setQueryModified,
  ])

  const hasModifiedPreset = activePreset && modified

  return (
    <Fragment>
      <div className={baseClass}>
        <div className={`${baseClass}__menu`}>
          <QueryPresetToggler
            activePreset={activePreset}
            openPresetListDrawer={openListDrawer}
            resetPreset={resetQueryPreset}
          />
          <Pill
            aria-label={t('general:newLabel', { label: presetConfig?.labels?.singular })}
            className={`${baseClass}__create-new-preset`}
            icon={<PlusIcon />}
            id="create-new-preset"
            onClick={() => {
              openCreateNewDrawer()
            }}
            size="small"
          />
        </div>
        <div className={`${baseClass}__menu-items`}>
          {hasModifiedPreset && (
            <ListSelectionButton
              id="reset-preset"
              key="reset"
              onClick={() => {
                setQuery({
                  columns: transformColumnsToSearchParams(activePreset.columns),
                  groupBy: activePreset.groupBy || null,
                  where: activePreset.where,
                })
                // After resetting to preset values, query matches preset - not modified
                setQueryModified(false)
              }}
              type="button"
            >
              {t('general:reset')}
            </ListSelectionButton>
          )}
          {hasModifiedPreset && queryPresetPermissions.update && (
            <ListSelectionButton
              id="save-preset"
              key="save"
              onClick={async () => {
                await saveCurrentChanges()
              }}
              type="button"
            >
              {activePreset?.isShared ? t('general:updateForEveryone') : t('fields:saveChanges')}
            </ListSelectionButton>
          )}
          {activePreset && queryPresetPermissions?.delete && (
            <Fragment>
              <ListSelectionButton
                id="delete-preset"
                onClick={() => openModal(confirmDeletePresetModalSlug)}
                type="button"
              >
                {t('general:deleteLabel', { label: presetConfig?.labels?.singular })}
              </ListSelectionButton>
              <ListSelectionButton
                id="edit-preset"
                onClick={() => {
                  openDocumentDrawer()
                }}
                type="button"
              >
                {t('general:editLabel', { label: presetConfig?.labels?.singular })}
              </ListSelectionButton>
            </Fragment>
          )}
        </div>
      </div>
      <CreateNewPresetDrawer
        initialData={{
          columns: transformColumnsToPreferences(query.columns),
          groupBy: query.groupBy,
          relatedCollection: collectionSlug,
          where: query.where,
        }}
        onSave={async ({ doc }) => {
          closeCreateNewDrawer()
          await handlePresetChange(doc as QueryPreset)
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
      <ListDrawer
        allowCreate={false}
        disableQueryPresets
        onSelect={async ({ doc }) => {
          closeListDrawer()
          await handlePresetChange(doc as QueryPreset)
        }}
      />
    </Fragment>
  )
}
