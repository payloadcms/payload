import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '@faceless-ui/window-info';
import Eyebrow from '../../../elements/Eyebrow.js';
import Paginator from '../../../elements/Paginator.js';
import ListControls from '../../../elements/ListControls.js';
import ListSelection from '../../../elements/ListSelection.js';
import Pill from '../../../elements/Pill.js';
import Button from '../../../elements/Button.js';
import { Table } from '../../../elements/Table.js';
import Meta from '../../../utilities/Meta.js';
import { Props } from './types.js';
import ViewDescription from '../../../elements/ViewDescription.js';
import PerPage from '../../../elements/PerPage.js';
import { Gutter } from '../../../elements/Gutter.js';
import { RelationshipProvider } from './RelationshipProvider.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';
import { StaggeredShimmers } from '../../../elements/ShimmerEffect.js';
import { SelectionProvider } from './SelectionProvider.js';
import EditMany from '../../../elements/EditMany.js';
import DeleteMany from '../../../elements/DeleteMany.js';
import PublishMany from '../../../elements/PublishMany.js';
import UnpublishMany from '../../../elements/UnpublishMany.js';
import formatFilesize from '../../../../../uploads/formatFilesize.js';

import './index.scss';

const baseClass = 'collection-list';

const DefaultList: React.FC<Props> = (props) => {
  const {
    collection,
    collection: {
      labels: {
        singular: singularLabel,
        plural: pluralLabel,
      },
      admin: {
        description,
        components: {
          BeforeList,
          BeforeListTable,
          AfterListTable,
          AfterList,
        } = {},
      } = {},
    },
    data,
    newDocumentURL,
    limit,
    hasCreatePermission,
    disableEyebrow,
    modifySearchParams,
    handleSortChange,
    handleWhereChange,
    handlePageChange,
    handlePerPageChange,
    customHeader,
    resetParams,
  } = props;

  const { breakpoints: { s: smallBreak } } = useWindowInfo();
  const { t, i18n } = useTranslation('general');
  let formattedDocs = data.docs || [];

  if (collection.upload) {
    formattedDocs = formattedDocs?.map((doc) => {
      return {
        ...doc,
        filesize: formatFilesize(doc.filesize),
      };
    });
  }

  return (
    <div className={baseClass}>
      {Array.isArray(BeforeList) && BeforeList.map((Component, i) => (
        <Component
          key={i}
          {...props}
        />
      ))}

      <Meta
        title={getTranslation(collection.labels.plural, i18n)}
      />
      <SelectionProvider
        docs={data.docs}
        totalDocs={data.totalDocs}
      >
        {!disableEyebrow && (
          <Eyebrow />
        )}
        <Gutter className={`${baseClass}__wrap`}>
          <header className={`${baseClass}__header`}>
            {customHeader && customHeader}
            {!customHeader && (
              <Fragment>
                <h1>
                  {getTranslation(pluralLabel, i18n)}
                </h1>
                {hasCreatePermission && (
                  <Pill
                    to={newDocumentURL}
                    aria-label={t('createNewLabel', { label: getTranslation(singularLabel, i18n) })}
                  >
                    {t('createNew')}
                  </Pill>
                )}
                {!smallBreak && (
                  <ListSelection
                    label={getTranslation(collection.labels.plural, i18n)}
                  />
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
            modifySearchQuery={modifySearchParams}
            handleSortChange={handleSortChange}
            handleWhereChange={handleWhereChange}
            resetParams={resetParams}
          />
          {Array.isArray(BeforeListTable) && BeforeListTable.map((Component, i) => (
            <Component
              key={i}
              {...props}
            />
          ))}
          {!data.docs && (
            <StaggeredShimmers
              className={[`${baseClass}__shimmer`, `${baseClass}__shimmer--rows`].join(' ')}
              count={6}
            />
          )}
          {(data.docs && data.docs.length > 0) && (
            <RelationshipProvider>
              <Table data={formattedDocs} />
            </RelationshipProvider>
          )}
          {data.docs && data.docs.length === 0 && (
            <div className={`${baseClass}__no-results`}>
              <p>
                {t('noResults', { label: getTranslation(pluralLabel, i18n) })}
              </p>
              {hasCreatePermission && newDocumentURL && (
                <Button
                  el="link"
                  to={newDocumentURL}
                >
                  {t('createNewLabel', { label: getTranslation(singularLabel, i18n) })}
                </Button>
              )}
            </div>
          )}
          {Array.isArray(AfterListTable) && AfterListTable.map((Component, i) => (
            <Component
              key={i}
              {...props}
            />
          ))}

          <div className={`${baseClass}__page-controls`}>
            <Paginator
              limit={data.limit}
              totalPages={data.totalPages}
              page={data.page}
              hasPrevPage={data.hasPrevPage}
              hasNextPage={data.hasNextPage}
              prevPage={data.prevPage}
              nextPage={data.nextPage}
              numberOfNeighbors={1}
              disableHistoryChange={modifySearchParams === false}
              onChange={handlePageChange}
            />
            {data?.totalDocs > 0 && (
              <Fragment>
                <div className={`${baseClass}__page-info`}>
                  {(data.page * data.limit) - (data.limit - 1)}
                  -
                  {data.totalPages > 1 && data.totalPages !== data.page ? (data.limit * data.page) : data.totalDocs}
                  {' '}
                  {t('of')}
                  {' '}
                  {data.totalDocs}
                </div>
                <PerPage
                  limits={collection?.admin?.pagination?.limits}
                  limit={limit}
                  modifySearchParams={modifySearchParams}
                  handleChange={handlePerPageChange}
                  resetPage={data.totalDocs <= data.pagingCounter}
                />
                <div className={`${baseClass}__list-selection`}>
                  {smallBreak && (
                    <Fragment>
                      <ListSelection
                        label={getTranslation(collection.labels.plural, i18n)}
                      />
                      <div className={`${baseClass}__list-selection-actions`}>
                        <EditMany
                          collection={collection}
                          resetParams={resetParams}
                        />
                        <PublishMany
                          collection={collection}
                          resetParams={resetParams}
                        />
                        <UnpublishMany
                          collection={collection}
                          resetParams={resetParams}
                        />
                        <DeleteMany
                          collection={collection}
                          resetParams={resetParams}
                        />
                      </div>
                    </Fragment>
                  )}
                </div>
              </Fragment>
            )}
          </div>
        </Gutter>
      </SelectionProvider>
      {Array.isArray(AfterList) && AfterList.map((Component, i) => (
        <Component
          key={i}
          {...props}
        />
      ))}
    </div>
  );
};

export default DefaultList;
