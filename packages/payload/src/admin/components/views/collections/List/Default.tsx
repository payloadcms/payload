import { useWindowInfo } from '@faceless-ui/window-info'
import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import formatFilesize from '../../../../../uploads/formatFilesize'
import { getTranslation } from '../../../../../utilities/getTranslation'
import Button from '../../../elements/Button'
import DeleteMany from '../../../elements/DeleteMany'
import EditMany from '../../../elements/EditMany'
import { Gutter } from '../../../elements/Gutter'
import { ListControls } from '../../../elements/ListControls'
import ListSelection from '../../../elements/ListSelection'
import Paginator from '../../../elements/Paginator'
import PerPage from '../../../elements/PerPage'
import Pill from '../../../elements/Pill'
import PublishMany from '../../../elements/PublishMany'
import { StaggeredShimmers } from '../../../elements/ShimmerEffect'
import { Table } from '../../../elements/Table'
import UnpublishMany from '../../../elements/UnpublishMany'
import ViewDescription from '../../../elements/ViewDescription'
import Meta from '../../../utilities/Meta'
import { RelationshipProvider } from './RelationshipProvider'
import { SelectionProvider } from './SelectionProvider'
import './index.scss'

const baseClass = 'collection-list'

const DefaultList: React.FC<Props> = (props) => {
  const {
    collection: {
      admin: {
        components: { AfterList, AfterListTable, BeforeList, BeforeListTable } = {},
        description,
      } = {},
      labels: { plural: pluralLabel, singular: singularLabel },
    },
    collection,
    customHeader,
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
  } = props

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()
  const { i18n, t } = useTranslation('general')
  let formattedDocs = data.docs || []

  if (collection.upload) {
    formattedDocs = formattedDocs?.map((doc) => {
      return {
        ...doc,
        filesize: formatFilesize(doc.filesize),
      }
    })
  }

  return (
    <div className={`${baseClass} ${baseClass}--${collection.slug}`}>
      {Array.isArray(BeforeList) &&
        BeforeList.map((Component, i) => <Component key={i} {...props} />)}

      <Meta title={getTranslation(collection.labels.plural, i18n)} />
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs}>
        <Gutter className={`${baseClass}__wrap`}>
          <header className={`${baseClass}__header`}>
            {customHeader && customHeader}
            {!customHeader && (
              <Fragment>
                <h1>{getTranslation(pluralLabel, i18n)}</h1>
                {hasCreatePermission && (
                  <Pill
                    aria-label={t('createNewLabel', { label: getTranslation(singularLabel, i18n) })}
                    to={newDocumentURL}
                  >
                    {t('createNew')}
                  </Pill>
                )}
                {!smallBreak && (
                  <ListSelection label={getTranslation(collection.labels.plural, i18n)} />
                )}
                {description && (
                  <div className={`${baseClass}__sub-header`}>
                    <ViewDescription description={description} />
                  </div>
                )}
              </Fragment>
            )}
          </header>
          <ListControls
            collection={collection}
            handleSearchChange={handleSearchChange}
            handleSortChange={handleSortChange}
            handleWhereChange={handleWhereChange}
            modifySearchQuery={modifySearchParams}
            resetParams={resetParams}
            titleField={titleField}
          />
          {Array.isArray(BeforeListTable) &&
            BeforeListTable.map((Component, i) => <Component key={i} {...props} />)}
          {!data.docs && (
            <StaggeredShimmers
              className={[`${baseClass}__shimmer`, `${baseClass}__shimmer--rows`].join(' ')}
              count={6}
            />
          )}
          {data.docs && data.docs.length > 0 && (
            <RelationshipProvider>
              <Table data={formattedDocs} />
            </RelationshipProvider>
          )}
          {data.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>{t('noResults', { label: getTranslation(pluralLabel, i18n) })}</p>
              {hasCreatePermission && newDocumentURL && (
                <Button el="link" to={newDocumentURL}>
                  {t('createNewLabel', { label: getTranslation(singularLabel, i18n) })}
                </Button>
              )}
            </div>
          )}
          {Array.isArray(AfterListTable) &&
            AfterListTable.map((Component, i) => <Component key={i} {...props} />)}
          {data.docs && data.docs.length > 0 && (
            <div className={`${baseClass}__page-controls`}>
              <Paginator
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
                    {t('of')} {data.totalDocs}
                  </div>
                  <PerPage
                    handleChange={handlePerPageChange}
                    limit={limit}
                    limits={collection?.admin?.pagination?.limits}
                    modifySearchParams={modifySearchParams}
                    resetPage={data.totalDocs <= data.pagingCounter}
                  />
                  {smallBreak && (
                    <div className={`${baseClass}__list-selection`}>
                      <Fragment>
                        <ListSelection label={getTranslation(collection.labels.plural, i18n)} />
                        <div className={`${baseClass}__list-selection-actions`}>
                          <EditMany collection={collection} resetParams={resetParams} />
                          <PublishMany collection={collection} resetParams={resetParams} />
                          <UnpublishMany collection={collection} resetParams={resetParams} />
                          <DeleteMany collection={collection} resetParams={resetParams} />
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
      {Array.isArray(AfterList) &&
        AfterList.map((Component, i) => <Component key={i} {...props} />)}
    </div>
  )
}

export default DefaultList
