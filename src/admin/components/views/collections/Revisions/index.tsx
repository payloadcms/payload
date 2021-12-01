import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Eyebrow from '../../../elements/Eyebrow';
import Loading from '../../../elements/Loading';
import { useStepNav } from '../../../elements/StepNav';
import { StepNavItem } from '../../../elements/StepNav/types';
import Meta from '../../../utilities/Meta';
import { Props } from './types';
import IDLabel from '../../../elements/IDLabel';
import { getColumns } from './columns';
import Table from '../../../elements/Table';
import Paginator from '../../../elements/Paginator';
import PerPage from '../../../elements/PerPage';

import './index.scss';
import { useSearchParams } from '../../../utilities/SearchParams';

const baseClass = 'collection-revisions';

const Revisions: React.FC<Props> = ({ collection }) => {
  const { serverURL, routes: { admin, api } } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id } } = useRouteMatch<{ id: string }>();
  const [tableColumns] = useState(() => getColumns(collection));
  const [fetchURL, setFetchURL] = useState('');
  const { page, sort, limit } = useSearchParams();

  const [{ data: doc }] = usePayloadAPI(`${serverURL}/api/${collection.slug}/${id}`);

  const [{ data: revisionsData, isLoading: isLoadingRevisions }, { setParams }] = usePayloadAPI(fetchURL);

  const useAsTitle = collection.admin.useAsTitle || 'id';

  useEffect(() => {
    const nav: StepNavItem[] = [
      {
        url: `${admin}/collections/${collection.slug}`,
        label: collection.labels.plural,
      },
      {
        label: doc ? doc[useAsTitle] : '',
        url: `${admin}/collections/${collection.slug}/${id}`,
      },
      {
        label: 'Revisions',
      },
    ];

    setStepNav(nav);
  }, [setStepNav, collection, useAsTitle, doc, admin, id]);

  useEffect(() => {
    const params = {
      depth: 1,
      page: undefined,
      sort: undefined,
      where: {
        parent: {
          equals: id,
        },
      },
      limit,
    };

    if (page) params.page = page;
    if (sort) params.sort = sort;

    // Performance enhancement
    // Setting the Fetch URL this way
    // prevents a double-fetch
    setFetchURL(`${serverURL}${api}/${collection.slug}/revisions`);
    setParams(params);
  }, [setParams, page, sort, collection, limit, serverURL, api, id]);

  const useIDLabel = doc[useAsTitle] === doc?.id;

  return (
    <div className={baseClass}>
      <Meta
        title={`Revisions - ${doc[useAsTitle]} - ${collection.labels.singular}`}
        description={`Viewing revisions for the ${collection.labels.singular} ${doc[useAsTitle]}`}
        keywords={`Revisions, ${collection.labels.singular}, Payload, CMS`}
      />
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <header className={`${baseClass}__header`}>
          Showing revisions for:
          {useIDLabel && (
            <IDLabel id={doc?.id} />
          )}
          {!useIDLabel && (
            <h1>
              {doc[useAsTitle]}
            </h1>
          )}
        </header>
        {isLoadingRevisions && (
          <Loading />
        )}
        {revisionsData?.docs && (
          <React.Fragment>
            <Table
              data={revisionsData?.docs}
              columns={tableColumns}
            />
            <div className={`${baseClass}__page-controls`}>
              <Paginator
                limit={revisionsData.limit}
                totalPages={revisionsData.totalPages}
                page={revisionsData.page}
                hasPrevPage={revisionsData.hasPrevPage}
                hasNextPage={revisionsData.hasNextPage}
                prevPage={revisionsData.prevPage}
                nextPage={revisionsData.nextPage}
                numberOfNeighbors={1}
              />
              {revisionsData?.totalDocs > 0 && (
              <React.Fragment>
                <div className={`${baseClass}__page-info`}>
                  {(revisionsData.page * revisionsData.limit) - (revisionsData.limit - 1)}
                  -
                  {revisionsData.totalPages > 1 && revisionsData.totalPages !== revisionsData.page ? (revisionsData.limit * revisionsData.page) : revisionsData.totalDocs}
                  {' '}
                  of
                  {' '}
                  {revisionsData.totalDocs}
                </div>
                <PerPage
                  collection={collection}
                  limit={limit ? Number(limit) : 10}
                />
              </React.Fragment>
          )}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default Revisions;
