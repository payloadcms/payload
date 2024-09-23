'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import { useWindowInfo } from '@faceless-ui/window-info'
import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import AnimateHeightImport from 'react-animate-height'

const AnimateHeight = (AnimateHeightImport.default ||
  AnimateHeightImport) as typeof AnimateHeightImport.default

import { useUseTitleField } from '../../hooks/useUseAsTitle.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { SearchIcon } from '../../icons/Search/index.js'
import { useListInfo } from '../../providers/ListInfo/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ColumnSelector } from '../ColumnSelector/index.js'
import { DeleteMany } from '../DeleteMany/index.js'
import { EditMany } from '../EditMany/index.js'
import { Pill } from '../Pill/index.js'
import { PublishMany } from '../PublishMany/index.js'
import { SearchFilter } from '../SearchFilter/index.js'
import { UnpublishMany } from '../UnpublishMany/index.js'
import { WhereBuilder } from '../WhereBuilder/index.js'
import validateWhereQuery from '../WhereBuilder/validateWhereQuery.js'
import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched.js'
import './index.scss'

const baseClass = 'list-controls'

export type ListControlsProps = {
  readonly collectionConfig: ClientCollectionConfig
  readonly enableColumns?: boolean
  readonly enableSort?: boolean
  readonly handleSearchChange?: (search: string) => void
  readonly handleSortChange?: (sort: string) => void
  readonly handleWhereChange?: (where: Where) => void
}

/**
 * The ListControls component is used to render the controls (search, filter, where)
 * for a collection's list view. You can find those directly above the table which lists
 * the collection's documents.
 */
export const ListControls: React.FC<ListControlsProps> = (props) => {
  const { collectionConfig, enableColumns = true, enableSort = false } = props

  const { handleSearchChange, params } = useListQuery()
  const { beforeActions, collectionSlug, disableBulkDelete, disableBulkEdit } = useListInfo()
  const titleField = useUseTitleField(collectionConfig)
  const { i18n, t } = useTranslation()
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  const searchLabel =
    (titleField &&
      getTranslation(
        'label' in titleField && typeof titleField.label === 'string'
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

  const hasWhereParam = useRef(Boolean(params?.where))

  const shouldInitializeWhereOpened = validateWhereQuery(params?.where)
  const [visibleDrawer, setVisibleDrawer] = useState<'columns' | 'sort' | 'where'>(
    shouldInitializeWhereOpened ? 'where' : undefined,
  )

  useEffect(() => {
    if (hasWhereParam.current && !params?.where) {
      setVisibleDrawer(undefined)
      hasWhereParam.current = false
    } else if (params?.where) {
      hasWhereParam.current = true
    }
  }, [setVisibleDrawer, params?.where])

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

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchIcon />
        <SearchFilter
          fieldName={titleField && 'name' in titleField ? titleField?.name : null}
          handleChange={(search) => {
            return void handleSearchChange(search)
          }}
          // @ts-expect-error @todo: fix types
          initialParams={params}
          key={collectionSlug}
          label={searchLabelTranslated.current}
        />
        <div className={`${baseClass}__buttons`}>
          <div className={`${baseClass}__buttons-wrap`}>
            {!smallBreak && (
              <React.Fragment>
                {beforeActions && beforeActions}
                {!disableBulkEdit && (
                  <Fragment>
                    <EditMany collection={collectionConfig} />
                    <PublishMany collection={collectionConfig} />
                    <UnpublishMany collection={collectionConfig} />
                  </Fragment>
                )}
                {!disableBulkDelete && <DeleteMany collection={collectionConfig} />}
              </React.Fragment>
            )}
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
          key={String(hasWhereParam.current && !params?.where)}
        />
      </AnimateHeight>
      {enableSort && (
        <AnimateHeight
          className={`${baseClass}__sort`}
          height={visibleDrawer === 'sort' ? 'auto' : 0}
          id={`${baseClass}-sort`}
        >
          <p>Sort Complex</p>
          {/* <SortComplex
            collection={collection}
            handleChange={handleSortChange}
            modifySearchQuery={modifySearchQuery}
          /> */}
        </AnimateHeight>
      )}
    </div>
  )
}
