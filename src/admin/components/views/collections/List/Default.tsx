import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import UploadGallery from '../../../elements/UploadGallery';
import Eyebrow from '../../../elements/Eyebrow';
import Paginator from '../../../elements/Paginator';
import ListControls from '../../../elements/ListControls';
import Pill from '../../../elements/Pill';
import Button from '../../../elements/Button';
import Table from '../../../elements/Table';
import Meta from '../../../utilities/Meta';
import { Props } from './types';

import './index.scss';
import ViewDescription from '../../../elements/ViewDescription';
import PerPage from '../../../elements/PerPage';

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
    setListControls,
    setSort,
    columns,
    hasCreatePermission,
  } = props;

  const { routes: { admin } } = useConfig();
  const history = useHistory();
  const { pathname, search } = useLocation();

  return (
    <div className={baseClass}>
      <Meta
        title={collection.labels.plural}
      />
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <header className={`${baseClass}__header`}>
          <h1>{pluralLabel}</h1>
          {hasCreatePermission && (
            <Pill to={newDocumentURL}>
              Create New
            </Pill>
          )}
          {description && (
            <div className={`${baseClass}__sub-header`}>
              <ViewDescription description={description} />
            </div>
          )}
        </header>
        <ListControls
          handleChange={setListControls}
          setSort={setSort}
          collection={collection}
          enableColumns={Boolean(!upload)}
          enableSort={Boolean(upload)}
        />
        {(data.docs && data.docs.length > 0) && (
          <React.Fragment
            key={`${pathname}${search}`}
          >
            {!upload && (
              <Table
                data={data.docs}
                columns={columns}
              />
            )}
            {upload && (
              <UploadGallery
                docs={data.docs}
                collection={collection}
                onCardClick={(doc) => history.push(`${admin}/collections/${slug}/${doc.id}`)}
              />
            )}
          </React.Fragment>
        )}
        {data.docs && data.docs.length === 0 && (
          <div className={`${baseClass}__no-results`}>
            <p>
              No
              {' '}
              {pluralLabel}
              {' '}
              found. Either no
              {' '}
              {pluralLabel}
              {' '}
              exist yet or none match the filters you&apos;ve specified above.
            </p>
            {hasCreatePermission && (
              <Button
                el="link"
                to={newDocumentURL}
              >
                Create new
                {' '}
                {singularLabel}
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
          />
          <PerPage
            collectionSlug={slug}
          />
          {data?.totalDocs > 0 && (
            <div className={`${baseClass}__page-info`}>
              {(data.page * data.limit) - (data.limit - 1)}
              -
              {data.totalPages > 1 && data.totalPages !== data.page ? (data.limit * data.page) : data.totalDocs}
              {' '}
              of
              {' '}
              {data.totalDocs}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultList;
