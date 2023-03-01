import React, { Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../utilities/Config';
import UploadGallery from '../../../elements/UploadGallery';
import Eyebrow from '../../../elements/Eyebrow';
import Paginator from '../../../elements/Paginator';
import ListControls from '../../../elements/ListControls';
import Pill from '../../../elements/Pill';
import Button from '../../../elements/Button';
import { Table } from '../../../elements/Table';
import Meta from '../../../utilities/Meta';
import { Props } from './types';
import ViewDescription from '../../../elements/ViewDescription';
import PerPage from '../../../elements/PerPage';
import { Gutter } from '../../../elements/Gutter';
import { RelationshipProvider } from './RelationshipProvider';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { StaggeredShimmers } from '../../../elements/ShimmerEffect';

import './index.scss';

const baseClass = 'collection-list';

const DefaultList: React.FC<Props> = (props) => {
  const {
    collection,
    collection: {
      upload,
      slug,
      labels: {
        singular: singularLabel,
        plural: pluralLabel,
      },
      admin: {
        description,
      } = {},
    },
    data,
    newDocumentURL,
    limit,
    hasCreatePermission,
    disableEyebrow,
    modifySearchParams,
    disableCardLink,
    onCardClick,
    handleSortChange,
    handleWhereChange,
    handlePageChange,
    handlePerPageChange,
    customHeader,
  } = props;

  const { routes: { admin } } = useConfig();
  const history = useHistory();
  const { t, i18n } = useTranslation('general');

  return (
    <div className={baseClass}>
      <Meta
        title={getTranslation(collection.labels.plural, i18n)}
      />
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
                <Pill to={newDocumentURL}>
                  {t('createNew')}
                </Pill>
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
          enableColumns={Boolean(!upload)}
          enableSort={Boolean(upload)}
          modifySearchQuery={modifySearchParams}
          handleSortChange={handleSortChange}
          handleWhereChange={handleWhereChange}
        />
        {!data.docs && (
          <StaggeredShimmers
            className={[
              `${baseClass}__shimmer`,
              upload ? `${baseClass}__shimmer--uploads` : `${baseClass}__shimmer--rows`,
            ].filter(Boolean).join(' ')}
            count={6}
            width={upload ? 'unset' : '100%'}
          />
        )}
        {(data.docs && data.docs.length > 0) && (
          <React.Fragment>
            {!upload && (
              <RelationshipProvider>
                <Table data={data.docs} />
              </RelationshipProvider>
            )}
            {upload && (
              <UploadGallery
                docs={data.docs}
                collection={collection}
                onCardClick={(doc) => {
                  if (typeof onCardClick === 'function') onCardClick(doc);
                  if (!disableCardLink) history.push(`${admin}/collections/${slug}/${doc.id}`);
                }}
              />
            )}
          </React.Fragment>
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
            </Fragment>
          )}
        </div>
      </Gutter>
    </div>
  );
};

export default DefaultList;
