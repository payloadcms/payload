'use client'
import type { QueryPreset, SanitizedCollectionPermission } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  formatAdminURL,
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import { CheckIcon } from '../../../icons/Check/index.js'
import { EditIcon } from '../../../icons/Edit/index.js'
import { FilterIcon } from '../../../icons/Filter/index.js'
import { GearIcon } from '../../../icons/Gear/index.js'
import { PlusIcon } from '../../../icons/Plus/index.js'
import { RefreshIcon } from '../../../icons/Refresh/index.js'
import { TrashIcon } from '../../../icons/Trash/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useListQuery } from '../../../providers/ListQuery/context.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { ConfirmationModal } from '../../ConfirmationModal/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { useListDrawer } from '../../ListDrawer/index.js'
import { useModal } from '../../Modal/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { Translation } from '../../Translation/index.js'
import './index.css'

const deletePresetModalSlug = 'delete-preset-confirmation'

const queryPresetsSlug = 'payload-query-presets'

const baseClass = 'query-preset-bar'

export const QueryPresetBar: React.FC<{
  activePreset: QueryPreset
  collectionSlug?: string
  queryPresetPermissions: SanitizedCollectionPermission
}> = ({ activePreset, collectionSlug, queryPresetPermissions }) => {
  const { modified, query, refineListData, setModified: setQueryModified } = useListQuery()
  const { openModal } = useModal()
  const [presets, setPresets] = useState<QueryPreset[]>([])

  const { i18n, t } = useTranslation()

  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const presetConfig = getEntityConfig({ collectionSlug: queryPresetsSlug })

  const [PresetDocumentDrawer, , { openDrawer: openPresetDrawer }] = useDocumentDrawer({
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

  const [ListDrawer, , { openDrawer: openListDrawer }] = useListDrawer({
    collectionSlugs: [queryPresetsSlug],
    filterOptions,
    selectedCollection: queryPresetsSlug,
  })

  // Fetch presets for the popup
  const fetchPresets = useCallback(async () => {
    try {
      const where = {
        and: [{ isTemp: { not_equals: true } }, { relatedCollection: { equals: collectionSlug } }],
      }
      const queryString = qs.stringify({ limit: 50, where }, { addQueryPrefix: true })
      const url = formatAdminURL({
        apiRoute,
        path: `/${queryPresetsSlug}${queryString}`,
        serverURL,
      })

      const response = await fetch(url, { credentials: 'include' })

      if (response.ok) {
        const data = await response.json()
        setPresets(data.docs || [])
      }
    } catch (_error) {
      // Silently fail - presets will remain empty
    }
  }, [apiRoute, collectionSlug, serverURL])

  useEffect(() => {
    void fetchPresets()
  }, [fetchPresets])

  const handlePresetChange = useCallback(
    async (preset: QueryPreset) => {
      await refineListData(
        {
          columns: preset.columns ? transformColumnsToSearchParams(preset.columns) : undefined,
          groupBy: preset.groupBy || '',
          preset: preset.id,
          where: preset.where,
        },
        false,
      )
    },
    [refineListData],
  )

  const buttonLabel =
    activePreset?.title ||
    t('general:selectLabel', { label: getTranslation(presetConfig?.labels?.singular, i18n) })

  const handleClearPreset = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      await refineListData(
        {
          columns: undefined,
          groupBy: '',
          preset: '',
          where: undefined,
        },
        false,
      )
    },
    [refineListData],
  )

  const handleDeletePreset = useCallback(async () => {
    if (!activePreset?.id) {
      return
    }

    try {
      const url = formatAdminURL({
        apiRoute,
        path: `/${queryPresetsSlug}/${activePreset.id}`,
        serverURL,
      })

      const response = await fetch(url, {
        credentials: 'include',
        method: 'DELETE',
      })

      if (response.ok) {
        // Clear the active preset and refresh the list
        await refineListData(
          {
            columns: undefined,
            groupBy: '',
            preset: '',
            where: undefined,
          },
          false,
        )
        void fetchPresets()
      }
    } catch (_error) {
      // Silently fail
    }
  }, [activePreset?.id, apiRoute, fetchPresets, refineListData, serverURL])

  const handleResetPreset = useCallback(async () => {
    if (!activePreset) {
      return
    }
    // Use the same pattern as handlePresetChange for consistency
    await refineListData(
      {
        columns: activePreset.columns ? transformColumnsToSearchParams(activePreset.columns) : [], // explicitly empty to clear user preferences fallback
        groupBy: activePreset.groupBy || '',
        preset: activePreset.id,
        where: activePreset.where,
      },
      false, // not modified - we're resetting to preset's original state
    )
  }, [activePreset, refineListData])

  const saveCurrentChanges = useCallback(async () => {
    if (!activePreset?.id) {
      return
    }
    try {
      const url = formatAdminURL({
        apiRoute,
        path: `/${queryPresetsSlug}/${activePreset.id}`,
        serverURL,
      })

      const response = await fetch(url, {
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
      })

      if (response.ok) {
        setQueryModified(false)
        void fetchPresets()
      }
    } catch (_error) {
      // Silently fail
    }
  }, [
    activePreset?.id,
    apiRoute,
    fetchPresets,
    query.columns,
    query.groupBy,
    query.where,
    serverURL,
    setQueryModified,
  ])

  // Detect if current query differs from preset on initial load
  useEffect(() => {
    if (!activePreset) {
      return
    }

    const presetColumns = activePreset.columns
      ? transformColumnsToSearchParams(activePreset.columns)
      : []
    const presetWhere = activePreset.where
    const presetGroupBy = activePreset.groupBy || ''

    // Normalize query.columns to empty array if undefined for comparison
    const queryColumns = query.columns || []

    // Compare current query with preset values
    const columnsMatch = JSON.stringify(queryColumns) === JSON.stringify(presetColumns)
    const whereMatch = JSON.stringify(query.where) === JSON.stringify(presetWhere)
    const groupByMatch = (query.groupBy || '') === presetGroupBy

    if (!columnsMatch || !whereMatch || !groupByMatch) {
      setQueryModified(true)
    }
  }, [activePreset, query.columns, query.where, query.groupBy, setQueryModified])

  const hasModifiedPreset = activePreset && modified

  return (
    <Fragment>
      <div className={baseClass}>
        <Popup
          className={`${baseClass}__popup`}
          horizontalAlign="left"
          portalClassName={`${baseClass}__popup-content`}
          render={({ close }) => (
            <PopupList.IconButtonGroup>
              {presets.map((preset) => (
                <PopupList.Button
                  active={activePreset?.id === preset.id}
                  key={preset.id}
                  onClick={async () => {
                    close()
                    await handlePresetChange(preset)
                  }}
                >
                  {preset.title}
                </PopupList.Button>
              ))}
              {activePreset && (
                <Fragment>
                  <PopupList.Divider />
                  {hasModifiedPreset && (
                    <PopupList.Button
                      icon={<RefreshIcon />}
                      id="reset-preset"
                      onClick={async () => {
                        close()
                        await handleResetPreset()
                      }}
                    >
                      {t('general:reset')}
                    </PopupList.Button>
                  )}
                  {hasModifiedPreset && queryPresetPermissions?.update && (
                    <PopupList.Button
                      icon={<CheckIcon />}
                      id="save-preset"
                      onClick={async () => {
                        close()
                        await saveCurrentChanges()
                      }}
                    >
                      {activePreset?.isShared
                        ? t('general:updateForEveryone')
                        : t('fields:saveChanges')}
                    </PopupList.Button>
                  )}
                  {queryPresetPermissions?.update && (
                    <PopupList.Button
                      icon={<EditIcon />}
                      onClick={() => {
                        close()
                        openPresetDrawer()
                      }}
                    >
                      {t('general:editLabel', {
                        label: getTranslation(presetConfig?.labels?.singular, i18n),
                      })}
                    </PopupList.Button>
                  )}
                  {queryPresetPermissions?.delete && (
                    <PopupList.Button
                      className={`${baseClass}__delete`}
                      icon={<TrashIcon small />}
                      onClick={() => {
                        close()
                        openModal(deletePresetModalSlug)
                      }}
                    >
                      {t('general:deleteLabel', {
                        label: getTranslation(presetConfig?.labels?.singular, i18n),
                      })}
                    </PopupList.Button>
                  )}
                </Fragment>
              )}
              {(presets.length > 0 || activePreset) && <PopupList.Divider />}
              {queryPresetPermissions?.create && (
                <PopupList.Button
                  icon={<PlusIcon />}
                  onClick={() => {
                    close()
                    openCreateNewDrawer()
                  }}
                >
                  {t('general:createNewLabel', {
                    label: getTranslation(presetConfig?.labels?.singular, i18n),
                  })}
                </PopupList.Button>
              )}
              <PopupList.Button
                icon={<GearIcon />}
                onClick={() => {
                  close()
                  openListDrawer()
                }}
              >
                {t('general:manageLabel', {
                  label: getTranslation(presetConfig?.labels?.plural, i18n),
                })}
              </PopupList.Button>
            </PopupList.IconButtonGroup>
          )}
          renderButton={({ onClick, onKeyDown, ...ariaProps }) => (
            <div className={`${baseClass}__trigger-wrap`}>
              <Button
                {...ariaProps}
                buttonStyle="secondary"
                className={`${baseClass}__trigger`}
                extraButtonProps={{ onKeyDown }}
                icon={<FilterIcon size={24} />}
                iconPosition="left"
                id="select-preset"
                onClick={onClick}
                size="medium"
              >
                {buttonLabel}
              </Button>
              {hasModifiedPreset && <span className={`${baseClass}__modified-indicator`} />}
              {activePreset && (
                <button className={`${baseClass}__clear`} onClick={handleClearPreset} type="button">
                  <XIcon size={16} />
                </button>
              )}
            </div>
          )}
          size="large"
          verticalAlign="bottom"
        />
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
          void fetchPresets()
        }}
        redirectAfterCreate={false}
      />
      <PresetDocumentDrawer
        onDelete={() => {
          void fetchPresets()
        }}
        onDuplicate={async ({ doc }) => {
          await handlePresetChange(doc as QueryPreset)
          void fetchPresets()
        }}
        onSave={async ({ doc }) => {
          await handlePresetChange(doc as QueryPreset)
          void fetchPresets()
        }}
      />
      <ListDrawer
        allowCreate={false}
        disableQueryPresets
        onSelect={async ({ doc }) => {
          await handlePresetChange(doc as QueryPreset)
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
              label: getTranslation(presetConfig?.labels?.singular, i18n),
              title: activePreset?.title,
            }}
          />
        }
        confirmLabel={t('general:delete')}
        heading={t('general:confirmDeletion')}
        modalSlug={deletePresetModalSlug}
        onConfirm={handleDeletePreset}
      />
    </Fragment>
  )
}
