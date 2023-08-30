import * as pkg from '@faceless-ui/window-info'
const { useWindowInfo } = pkg
import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types.js'

import formatFilesize from '../../../../../uploads/formatFilesize.js'
import { getTranslation } from '../../../../../utilities/getTranslation.js'
import Button from '../../../elements/Button/index.js'
import DeleteMany from '../../../elements/DeleteMany/index.js'
import EditMany from '../../../elements/EditMany/index.js'
import Eyebrow from '../../../elements/Eyebrow/index.js'
import { Gutter } from '../../../elements/Gutter/index.js'
import ListControls from '../../../elements/ListControls/index.js'
import ListSelection from '../../../elements/ListSelection/index.js'
import Paginator from '../../../elements/Paginator/index.js'
import PerPage from '../../../elements/PerPage/index.js'
import Pill from '../../../elements/Pill/index.js'
import PublishMany from '../../../elements/PublishMany/index.js'
import { StaggeredShimmers } from '../../../elements/ShimmerEffect/index.js'
import { Table } from '../../../elements/Table/index.js'
import UnpublishMany from '../../../elements/UnpublishMany/index.js'
import ViewDescription from '../../../elements/ViewDescription/index.js'
import Meta from '../../../utilities/Meta/index.js'
import { RelationshipProvider } from './RelationshipProvider/index.js'
import { SelectionProvider } from './SelectionProvider/index.js'
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
    disableEyebrow,
    handlePageChange,
    handlePerPageChange,
    handleSortChange,
    handleWhereChange,
    hasCreatePermission,
    limit,
    modifySearchParams,
    newDocumentURL,
    resetParams,
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
    <div className={baseClass}>
      {Array.isArray(BeforeList) &&
        BeforeList.map((Component, i) => <Component key={i} {...props} />)}

      <Meta title={getTranslation(collection.labels.plural, i18n)} />
      <SelectionProvider docs={data.docs} totalDocs={data.totalDocs}>
        {!disableEyebrow && <Eyebrow />}
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
            handleSortChange={handleSortChange}
            handleWhereChange={handleWhereChange}
            modifySearchQuery={modifySearchParams}
            resetParams={resetParams}
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
                <div className={`${baseClass}__list-selection`}>
                  {smallBreak && (
                    <Fragment>
                      <ListSelection label={getTranslation(collection.labels.plural, i18n)} />
                      <div className={`${baseClass}__list-selection-actions`}>
                        <EditMany collection={collection} resetParams={resetParams} />
                        <PublishMany collection={collection} resetParams={resetParams} />
                        <UnpublishMany collection={collection} resetParams={resetParams} />
                        <DeleteMany collection={collection} resetParams={resetParams} />
                      </div>
                    </Fragment>
                  )}
                </div>
              </Fragment>
            )}
          </div>
        </Gutter>
      </SelectionProvider>
      {Array.isArray(AfterList) &&
        AfterList.map((Component, i) => <Component key={i} {...props} />)}
    </div>
  )
}

export default DefaultList
