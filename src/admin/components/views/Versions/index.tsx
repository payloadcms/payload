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

const baseClass = 'versions';

const Versions: React.FC<Props> = ({ collection, global }) => {
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
    docURL = `${serverURL}${api}/${slug}/${id}`;
    entityLabel = collection.labels.singular;
  }

  if (global) {
    ({ slug } = global);
    docURL = `${serverURL}${api}/globals/${slug}`;
    entityLabel = global.label;
  }

  const useAsTitle = collection?.admin?.useAsTitle || 'id';
  const [{ data: doc }] = usePayloadAPI(docURL, { initialParams: { draft: 'true' } });
  const [{ data: versionsData, isLoading: isLoadingVersions }, { setParams }] = usePayloadAPI(fetchURL);

  useEffect(() => {
    let nav: StepNavItem[] = [];

    if (collection) {
      let docLabel = '';

      if (doc) {
        if (useAsTitle) {
          if (doc[useAsTitle]) {
            docLabel = doc[useAsTitle];
          } else {
            docLabel = '[Untitled]';
          }
        } else {
          docLabel = doc.id;
        }
      }

      nav = [
        {
          url: `${admin}/collections/${collection.slug}`,
          label: collection.labels.plural,
        },
        {
          label: docLabel,
          url: `${admin}/collections/${collection.slug}/${id}`,
        },
        {
          label: 'Versions',
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
          label: 'Versions',
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
      limit,
      where: {},
    };

    if (page) params.page = page;
    if (sort) params.sort = sort;

    let fetchURLToSet: string;

    if (collection) {
      fetchURLToSet = `${serverURL}${api}/${collection.slug}/versions`;
      params.where = {
        parent: {
          equals: id,
        },
      };
    }

    if (global) {
      fetchURLToSet = `${serverURL}${api}/globals/${global.slug}/versions`;
    }

    // Performance enhancement
    // Setting the Fetch URL this way
    // prevents a double-fetch

    setFetchURL(fetchURLToSet);

    setParams(params);
  }, [setParams, page, sort, limit, serverURL, api, id, global, collection]);

  let useIDLabel = doc[useAsTitle] === doc?.id;
  let heading: string;
  let metaDesc: string;
  let metaTitle: string;

  if (collection) {
    metaTitle = `Versions - ${doc[useAsTitle]} - ${entityLabel}`;
    metaDesc = `Viewing versions for the ${entityLabel} ${doc[useAsTitle]}`;
    heading = doc?.[useAsTitle];
  }

  if (global) {
    metaTitle = `Versions - ${entityLabel}`;
    metaDesc = `Viewing versions for the global ${entityLabel}`;
    heading = entityLabel;
    useIDLabel = false;
  }

  return (
    <div className={baseClass}>
      <Meta
        title={metaTitle}
        description={metaDesc}
      />
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <header className={`${baseClass}__header`}>
          <div className={`${baseClass}__intro`}>Showing versions for:</div>
          {useIDLabel && (
            <IDLabel id={doc?.id} />
          )}
          {!useIDLabel && (
            <h1>
              {heading}
            </h1>
          )}
        </header>
        {isLoadingVersions && (
          <Loading />
        )}
        {versionsData?.docs && (
          <React.Fragment>
            <Table
              data={versionsData?.docs}
              columns={tableColumns}
            />
            <div className={`${baseClass}__page-controls`}>
              <Paginator
                limit={versionsData.limit}
                totalPages={versionsData.totalPages}
                page={versionsData.page}
                hasPrevPage={versionsData.hasPrevPage}
                hasNextPage={versionsData.hasNextPage}
                prevPage={versionsData.prevPage}
                nextPage={versionsData.nextPage}
                numberOfNeighbors={1}
              />
              {versionsData?.totalDocs > 0 && (
              <React.Fragment>
                <div className={`${baseClass}__page-info`}>
                  {(versionsData.page * versionsData.limit) - (versionsData.limit - 1)}
                  -
                  {versionsData.totalPages > 1 && versionsData.totalPages !== versionsData.page ? (versionsData.limit * versionsData.page) : versionsData.totalDocs}
                  {' '}
                  of
                  {' '}
                  {versionsData.totalDocs}
                </div>
                <PerPage
                  limits={collection?.admin?.pagination?.limits}
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

export default Versions;
