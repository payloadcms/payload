'use client'

import { useWindowInfo } from '@faceless-ui/window-info'
import { getTranslation } from '@payloadcms/translations'
import { validateWhereQuery } from 'payload/shared'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import type { ListControlsProps } from './types.js'

import { Popup, PopupList } from '../../elements/Popup/index.js'
import { useUseTitleField } from '../../hooks/useUseAsTitle.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { Dots } from '../../icons/Dots/index.js'
import { SearchIcon } from '../../icons/Search/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { Pill } from '../Pill/index.js'
import { SearchFilter } from '../SearchFilter/index.js'
import { WhereBuilder } from '../WhereBuilder/index.js'
import { ActiveQueryPreset } from './ActiveQueryPreset/index.js'
import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched.js'
import { useQueryPresets } from './useQueryPresets.js'
import './index.scss'

const baseClass = 'list-controls'

/**
 * The ListControls component is used to render the controls (search, filter, where)
 * for a collection's list view. You can find those directly above the table which lists
 * the collection's documents.
 */
export const ListControls: React.FC<ListControlsProps> = (props) => {
  const {
    beforeActions,
    collectionConfig,
    collectionSlug,
    disableQueryPresets,
    enableColumns = true,
    enableSort = false,
    listMenuItems: listMenuItemsFromProps,
    queryPreset: activePreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions,
  } = props

  const { handleSearchChange, query } = useListQuery()

  const {
    CreateNewPresetDrawer,
    DeletePresetModal,
    EditPresetDrawer,
    hasModifiedPreset,
    openPresetListDrawer,
    PresetListDrawer,
    queryPresetMenuItems,
    resetPreset,
  } = useQueryPresets({
    activePreset,
    collectionSlug,
    queryPresetPermissions,
  })

  const titleField = useUseTitleField(collectionConfig)
  const { i18n, t } = useTranslation()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const searchLabel =
    (titleField &&
      getTranslation(
        'label' in titleField &&
          (typeof titleField.label === 'string' || typeof titleField.label === 'object')
          ? titleField.label
          : 'name' in titleField
            ? titleField.name
            : null,
        i18n,
      )) ??
    'ID'

  const listSearchableFields = getTextFieldsToBeSearched(
    collectionConfig.admin.listSearchableFields,
    collectionConfig.fields,
  )

  const searchLabelTranslated = useRef(
    t('general:searchBy', { label: getTranslation(searchLabel, i18n) }),
  )

  const hasWhereParam = useRef(Boolean(query?.where))

  const shouldInitializeWhereOpened = validateWhereQuery(query?.where)
  const [visibleDrawer, setVisibleDrawer] = useState<'columns' | 'sort' | 'where'>(
    shouldInitializeWhereOpened ? 'where' : undefined,
  )

  useEffect(() => {
    if (hasWhereParam.current && !query?.where) {
      hasWhereParam.current = false
    } else if (query?.where) {
      hasWhereParam.current = true
    }
  }, [setVisibleDrawer, query?.where])

  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      searchLabelTranslated.current = listSearchableFields.reduce(
        (placeholderText: string, field, i: number) => {
          const label =
            'label' in field && field.label ? field.label : 'name' in field ? field.name : null

          if (i === 0) {
            return `${t('general:searchBy', {
              label: getTranslation(label, i18n),
            })}`
          }

          if (i === listSearchableFields.length - 1) {
            return `${placeholderText} ${t('general:or')} ${getTranslation(label, i18n)}`
          }

          return `${placeholderText}, ${getTranslation(label, i18n)}`
        },
        '',
      )
    } else {
      searchLabelTranslated.current = t('general:searchBy', {
        label: getTranslation(searchLabel, i18n),
      })
    }
  }, [t, listSearchableFields, i18n, searchLabel])

  let listMenuItems: React.ReactNode[] = listMenuItemsFromProps

  if (
    collectionConfig?.enableQueryPresets &&
    !disableQueryPresets &&
    queryPresetMenuItems?.length > 0
  ) {
    // Cannot push or unshift into `listMenuItemsFromProps` as it will mutate the original array
    listMenuItems = [
      ...queryPresetMenuItems,
      listMenuItemsFromProps?.length > 0 ? <PopupList.Divider key="divider" /> : null,
      ...(listMenuItemsFromProps || []),
    ]
  }

  return (
    <Fragment>
      <div className={baseClass}>
        <div className={`${baseClass}__wrap`}>
          <SearchIcon />
          <SearchFilter
            fieldName={titleField && 'name' in titleField ? titleField?.name : null}
            handleChange={(search) => {
              return void handleSearchChange(search)
            }}
            // @ts-expect-error @todo: fix types
            initialParams={query}
            key={collectionSlug}
            label={searchLabelTranslated.current}
          />
          {activePreset && hasModifiedPreset ? (
            <div className={`${baseClass}__modified`}>Modified</div>
          ) : null}
          <div className={`${baseClass}__buttons`}>
            <div className={`${baseClass}__buttons-wrap`}>
              {!smallBreak && <React.Fragment>{beforeActions && beforeActions}</React.Fragment>}
              {enableColumns && (
                <Pill
                  aria-controls={`${baseClass}-columns`}
                  aria-expanded={visibleDrawer === 'columns'}
                  className={`${baseClass}__toggle-columns`}
                  icon={<ChevronIcon direction={visibleDrawer === 'columns' ? 'up' : 'down'} />}
                  onClick={() =>
                    setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined)
                  }
                  pillStyle="light"
                >
                  {t('general:columns')}
                </Pill>
              )}
              <Pill
                aria-controls={`${baseClass}-where`}
                aria-expanded={visibleDrawer === 'where'}
                className={`${baseClass}__toggle-where`}
                icon={<ChevronIcon direction={visibleDrawer === 'where' ? 'up' : 'down'} />}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)}
                pillStyle="light"
              >
                {t('general:filters')}
              </Pill>
              {enableSort && (
                <Pill
                  aria-controls={`${baseClass}-sort`}
                  aria-expanded={visibleDrawer === 'sort'}
                  className={`${baseClass}__toggle-sort`}
                  icon={<ChevronIcon />}
                  onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
                  pillStyle="light"
                >
                  {t('general:sort')}
                </Pill>
              )}
              {!disableQueryPresets && (
                <ActiveQueryPreset
                  activePreset={activePreset}
                  openPresetListDrawer={openPresetListDrawer}
                  resetPreset={resetPreset}
                />
              )}
              {listMenuItems && Array.isArray(listMenuItems) && listMenuItems.length > 0 && (
                <Popup
                  button={<Dots ariaLabel={t('general:moreOptions')} />}
                  className={`${baseClass}__popup`}
                  horizontalAlign="right"
                  id="list-menu"
                  size="large"
                  verticalAlign="bottom"
                >
                  <PopupList.ButtonGroup>
                    {listMenuItems.map((item, i) => (
                      <Fragment key={`list-menu-item-${i}`}>{item}</Fragment>
                    ))}
                  </PopupList.ButtonGroup>
                </Popup>
              )}
            </div>
          </div>
        </div>
        {enableColumns && (
          <AnimateHeight
            className={`${baseClass}__columns`}
            height={visibleDrawer === 'columns' ? 'auto' : 0}
            id={`${baseClass}-columns`}
          >
            <ColumnSelector collectionSlug={collectionConfig.slug} />
          </AnimateHeight>
        )}
        <AnimateHeight
          className={`${baseClass}__where`}
          height={visibleDrawer === 'where' ? 'auto' : 0}
          id={`${baseClass}-where`}
        >
          <WhereBuilder
            collectionPluralLabel={collectionConfig?.labels?.plural}
            collectionSlug={collectionConfig.slug}
            fields={collectionConfig?.fields}
            renderedFilters={renderedFilters}
            resolvedFilterOptions={resolvedFilterOptions}
          />
        </AnimateHeight>
      </div>
      {PresetListDrawer}
      {EditPresetDrawer}
      {CreateNewPresetDrawer}
      {DeletePresetModal}
    </Fragment>
  )
}
