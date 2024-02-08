'use client'
import React, { Fragment } from 'react'

import type { DefaultListViewProps } from './types'
import { SelectionProvider } from './SelectionProvider'
import { Gutter } from '../../elements/Gutter'
import { getTranslation } from '@payloadcms/translations'
import Pill from '../../elements/Pill'
import { StaggeredShimmers } from '../../elements/ShimmerEffect'
import { RelationshipProvider } from './RelationshipProvider'
import { Button } from '../../elements/Button'
import { PerPage } from '../../elements/PerPage'
import { Pagination } from '../../elements/Pagination'
import { useConfig } from '../../providers/Config'
import { useTranslation } from '../../providers/Translation'
import { useComponentMap } from '../../providers/ComponentMapProvider'
import { Table } from '../../elements/Table'

import './index.scss'
import { ListControls } from '../../elements/ListControls'

const baseClass = 'collection-list'

export const DefaultList: React.FC<DefaultListViewProps> = (props) => {
  const {
    Header,
    data,
    handlePageChange,
    handlePerPageChange,
    handleSearchChange,
    handleSortChange,
    handleWhereChange,
    hasCreatePermission,
    limit,
    modifySearchParams,
    newDocumentURL,
    resetParams,
    titleField,
    collectionSlug,
  } = props

  const config = useConfig()

  const { componentMap } = useComponentMap()

  const collectionComponentMap = componentMap?.collections?.[collectionSlug]

  const { BeforeList, AfterList, BeforeListTable, AfterListTable } = collectionComponentMap || {}

  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  const { labels } = collectionConfig

  const { i18n } = useTranslation()

  let docs = data.docs || []

  if (collectionConfig.upload) {
    docs = docs?.map((doc) => {
      return {
        ...doc,
        // filesize: formatFilesize(doc.filesize),
      }
    })
  }

  return (
    <div className={baseClass}>
      {BeforeList}
      {/* <Meta title={getTranslation(collection.labels.plural, i18n)} /> */}
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs}>
        <Gutter className={`${baseClass}__wrap`}>
          <header className={`${baseClass}__header`}>
            {Header || (
              <Fragment>
                <h1>{getTranslation(labels?.plural, i18n)}</h1>
                {hasCreatePermission && (
                  <Pill
                    aria-label={i18n.t('general:createNewLabel', {
                      label: getTranslation(labels?.singular, i18n),
                    })}
                    to={newDocumentURL}
                  >
                    {i18n.t('general:createNew')}
                  </Pill>
                )}
                {/* {!smallBreak && (
                  <ListSelection label={getTranslation(collection.labels.plural, i18n)} />
                )} */}
                {/* {description && (
                  <div className={`${baseClass}__sub-header`}>
                    <ViewDescription description={description} />
                  </div>
                )} */}
              </Fragment>
            )}
          </header>
          <ListControls
            collectionPluralLabel={labels?.plural}
            collectionSlug={collectionSlug}
            // textFieldsToBeSearched={textFieldsToBeSearched}
            // handleSearchChange={handleSearchChange}
            // handleSortChange={handleSortChange}
            // handleWhereChange={handleWhereChange}
            // modifySearchQuery={modifySearchParams}
            // resetParams={resetParams}
            titleField={titleField}
          />
          {BeforeListTable}
          {!data.docs && (
            <StaggeredShimmers
              className={[`${baseClass}__shimmer`, `${baseClass}__shimmer--rows`].join(' ')}
              count={6}
            />
          )}
          {data.docs && data.docs.length > 0 && (
            <RelationshipProvider>
              <Table
                data={docs}
                customCellContext={{
                  collectionSlug,
                  uploadConfig: collectionConfig.upload,
                }}
              />
            </RelationshipProvider>
          )}
          {data.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>{i18n.t('general:noResults', { label: getTranslation(labels?.plural, i18n) })}</p>
              {hasCreatePermission && newDocumentURL && (
                <Button el="link" to={newDocumentURL}>
                  {i18n.t('general:createNewLabel', {
                    label: getTranslation(labels?.singular, i18n),
                  })}
                </Button>
              )}
            </div>
          )}
          {AfterListTable}
          {data.docs && data.docs.length > 0 && (
            <div className={`${baseClass}__page-controls`}>
              <Pagination
                disableHistoryChange={modifySearchParams === false}
                hasNextPage={data.hasNextPage}
                hasPrevPage={data.hasPrevPage}
                limit={data.limit}
                nextPage={data.nextPage}
                numberOfNeighbors={1}
                onChange={handlePageChange}
                page={data.page}
                prevPage={data.prevPage}
                totalPages={data.totalPages}
              />
              {data?.totalDocs > 0 && (
                <Fragment>
                  <div className={`${baseClass}__page-info`}>
                    {data.page * data.limit - (data.limit - 1)}-
                    {data.totalPages > 1 && data.totalPages !== data.page
                      ? data.limit * data.page
                      : data.totalDocs}{' '}
                    {i18n.t('general:of')} {data.totalDocs}
                  </div>
                  <PerPage
                    handleChange={handlePerPageChange}
                    limit={limit}
                    limits={collectionConfig?.admin?.pagination?.limits}
                    modifySearchParams={modifySearchParams}
                    resetPage={data.totalDocs <= data.pagingCounter}
                  />
                  {/* {smallBreak && (
                    <div className={`${baseClass}__list-selection`}>
                      <Fragment>
                        <ListSelection label={getTranslation(collection.labels.plural, i18n)} />
                        <div className={`${baseClass}__list-selection-actions`}>
                          <EditMany resetParams={resetParams} />
                          <PublishMany resetParams={resetParams} />
                          <UnpublishMany resetParams={resetParams} />
                          <DeleteMany resetParams={resetParams} />
                        </div>
                      </Fragment>
                    </div>
                  )} */}
                </Fragment>
              )}
            </div>
          )}
        </Gutter>
      </SelectionProvider>
      {AfterList}
    </div>
  )
}
