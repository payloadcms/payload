import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import Loading from '../../elements/Loading';
import { useStepNav } from '../../elements/StepNav';
import { StepNavItem } from '../../elements/StepNav/types';
import Meta from '../../utilities/Meta';
import { Props } from './types';
import IDLabel from '../../elements/IDLabel';
import { getColumns } from './columns';
import Table from '../../elements/Table';
import Paginator from '../../elements/Paginator';
import PerPage from '../../elements/PerPage';
import { useSearchParams } from '../../utilities/SearchParams';

import './index.scss';

const baseClass = 'revisions';

const Revisions: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api } } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id } } = useRouteMatch<{ id: string }>();
  const [tableColumns] = useState(() => getColumns(collection, global));
  const [fetchURL, setFetchURL] = useState('');
  const { page, sort, limit } = useSearchParams();

  let docURL: string;
  let entityLabel: string;
  let slug: string;

  if (collection) {
    ({ slug } = collection);
    docURL = `${serverURL}/api/${slug}/${id}`;
    entityLabel = collection.labels.singular;
  }

  if (global) {
    ({ slug } = global);
    docURL = `${serverURL}/api/globals/${slug}`;
    entityLabel = global.label;
  }

  const useAsTitle = collection?.admin?.useAsTitle || 'id';
  const [{ data: doc }] = usePayloadAPI(docURL);
  const [{ data: revisionsData, isLoading: isLoadingRevisions }, { setParams }] = usePayloadAPI(fetchURL);

  useEffect(() => {
    let nav: StepNavItem[] = [];

    if (collection) {
      nav = [
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
    }

    if (global) {
      nav = [
        {
          url: `${admin}/globals/${global.slug}`,
          label: global.label,
        },
        {
          label: 'Revisions',
        },
      ];
    }

    setStepNav(nav);
  }, [setStepNav, collection, global, useAsTitle, doc, admin, id]);

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

    setFetchURL(`${serverURL}${api}/${slug}/revisions`);

    setParams(params);
  }, [setParams, page, sort, slug, limit, serverURL, api, id]);

  const useIDLabel = doc[useAsTitle] === doc?.id;

  let heading: string;
  let metaDesc: string;
  if (collection) {
    metaDesc = `Viewing revisions for the ${entityLabel} ${doc[useAsTitle]}`;
    heading = doc?.[useAsTitle];
  }

  if (global) {
    metaDesc = `Viewing revisions for the global ${entityLabel}`;
    heading = entityLabel;
  }

  return (
    <div className={baseClass}>
      <Meta
        title={`Revisions - ${doc[useAsTitle]} - ${entityLabel}`}
        description={metaDesc}
        keywords={`Revisions, ${entityLabel}, Payload, CMS`}
      />
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <header className={`${baseClass}__header`}>
          <div className={`${baseClass}__intro`}>Showing revisions for:</div>
          {useIDLabel && (
            <IDLabel id={doc?.id} />
          )}
          {!useIDLabel && (
            <h1>
              {heading}
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
