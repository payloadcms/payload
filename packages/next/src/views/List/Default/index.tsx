'use client'
import { getTranslation } from '@payloadcms/translations'
import { Button } from '@payloadcms/ui/elements/Button'
import { DeleteMany } from '@payloadcms/ui/elements/DeleteMany'
import { EditMany } from '@payloadcms/ui/elements/EditMany'
import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { ListControls } from '@payloadcms/ui/elements/ListControls'
import { ListSelection } from '@payloadcms/ui/elements/ListSelection'
import { Pagination } from '@payloadcms/ui/elements/Pagination'
import { PerPage } from '@payloadcms/ui/elements/PerPage'
import { Pill } from '@payloadcms/ui/elements/Pill'
import { PublishMany } from '@payloadcms/ui/elements/PublishMany'
import { StaggeredShimmers } from '@payloadcms/ui/elements/ShimmerEffect'
import { useStepNav } from '@payloadcms/ui/elements/StepNav'
import { Table } from '@payloadcms/ui/elements/Table'
import { UnpublishMany } from '@payloadcms/ui/elements/UnpublishMany'
import { useWindowInfo } from '@payloadcms/ui/elements/WindowInfo'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useListInfo } from '@payloadcms/ui/providers/ListInfo'
import { SelectionProvider } from '@payloadcms/ui/providers/Selection'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import LinkImport from 'next/link.js'
import { formatFilesize } from 'payload/utilities'
import React, { Fragment, useEffect } from 'react'

import type { CollectionComponentMap } from '../../../../../ui/src/providers/ComponentMap/buildComponentMap/types.js'

import { RelationshipProvider } from './RelationshipProvider/index.js'
import './index.scss'

const baseClass = 'collection-list'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const DefaultListView: React.FC = () => {
  const {
    Header,
    collectionSlug,
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
    titleField,
  } = useListInfo()

  const config = useConfig()

  const { getComponentMap } = useComponentMap()

  const componentMap = getComponentMap({ collectionSlug }) as CollectionComponentMap

  const { AfterList, AfterListTable, BeforeList, BeforeListTable, actionsMap } = componentMap || {}

  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  const { labels } = collectionConfig

  const { i18n } = useTranslation()

  const { setStepNav } = useStepNav()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  let docs = data.docs || []

  if (collectionConfig.upload) {
    docs = docs?.map((doc) => {
      return {
        ...doc,
        filesize: formatFilesize(doc.filesize),
      }
    })
  }

  useEffect(() => {
    setStepNav([
      {
        label: labels?.plural,
      },
    ])
  }, [setStepNav, labels])

  return (
    <div className={baseClass}>
      <SetViewActions actions={actionsMap?.List} />
      {BeforeList}
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
                {!smallBreak && (
                  <ListSelection label={getTranslation(collectionConfig.labels.plural, i18n)} />
                )}
                {/* {description && (
                  <div className={`${baseClass}__sub-header`}>
                    <ViewDescription description={description} />
                  </div>
                )} */}
              </Fragment>
            )}
          </header>
          <ListControls
            collectionConfig={collectionConfig}
            // textFieldsToBeSearched={textFieldsToBeSearched}
            // handleSearchChange={handleSearchChange}
            // handleSortChange={handleSortChange}
            // handleWhereChange={handleWhereChange}
            // modifySearchQuery={modifySearchParams}
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
                customCellContext={{
                  collectionSlug,
                  uploadConfig: collectionConfig.upload,
                }}
                data={docs}
              />
            </RelationshipProvider>
          )}
          {data.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>{i18n.t('general:noResults', { label: getTranslation(labels?.plural, i18n) })}</p>
              {hasCreatePermission && newDocumentURL && (
                <Button Link={Link} el="link" to={newDocumentURL}>
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
                  {smallBreak && (
                    <div className={`${baseClass}__list-selection`}>
                      <Fragment>
                        <ListSelection
                          label={getTranslation(collectionConfig.labels.plural, i18n)}
                        />
                        <div className={`${baseClass}__list-selection-actions`}>
                          <EditMany collection={collectionConfig} />
                          <PublishMany collection={collectionConfig} />
                          <UnpublishMany collection={collectionConfig} />
                          <DeleteMany collection={collectionConfig} />
                        </div>
                      </Fragment>
                    </div>
                  )}
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
