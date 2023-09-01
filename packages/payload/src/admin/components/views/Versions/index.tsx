import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteMatch } from 'react-router-dom';

import type { StepNavItem } from '../../elements/StepNav/types';
import type { Props } from './types';

import { getTranslation } from '../../../../utilities/getTranslation';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import { Gutter } from '../../elements/Gutter';
import IDLabel from '../../elements/IDLabel';
import { LoadingOverlayToggle } from '../../elements/Loading';
import Paginator from '../../elements/Paginator';
import PerPage from '../../elements/PerPage';
import { useStepNav } from '../../elements/StepNav';
import { Table } from '../../elements/Table';
import { useConfig } from '../../utilities/Config';
import Meta from '../../utilities/Meta';
import { useSearchParams } from '../../utilities/SearchParams';
import { buildVersionColumns } from './columns';
import './index.scss';

const baseClass = 'versions';

const Versions: React.FC<Props> = ({ collection, global }) => {
  const { routes: { admin, api }, serverURL } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id } } = useRouteMatch<{ id: string }>();
  const { i18n, t } = useTranslation('version');
  const [fetchURL, setFetchURL] = useState('');
  const { limit, page, sort } = useSearchParams();

  let docURL: string;
  let entityLabel: string;
  let slug: string;
  let editURL: string;

  if (collection) {
    ({ slug } = collection);
    docURL = `${serverURL}${api}/${slug}/${id}`;
    entityLabel = getTranslation(collection.labels.singular, i18n);
    editURL = `${admin}/collections/${collection.slug}/${id}`;
  }

  if (global) {
    ({ slug } = global);
    docURL = `${serverURL}${api}/globals/${slug}`;
    entityLabel = getTranslation(global.label, i18n);
    editURL = `${admin}/globals/${global.slug}`;
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
            docLabel = `[${t('general:untitled')}]`;
          }
        } else {
          docLabel = doc.id;
        }
      }

      nav = [
        {
          label: getTranslation(collection.labels.plural, i18n),
          url: `${admin}/collections/${collection.slug}`,
        },
        {
          label: docLabel,
          url: editURL,
        },
        {
          label: t('versions'),
        },
      ];
    }

    if (global) {
      nav = [
        {
          label: getTranslation(global.label, i18n),
          url: editURL,
        },
        {
          label: t('versions'),
        },
      ];
    }

    setStepNav(nav);
  }, [setStepNav, collection, global, useAsTitle, doc, admin, id, editURL, t, i18n]);

  useEffect(() => {
    const params = {
      depth: 1,
      limit,
      page: undefined,
      sort: undefined,
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
    metaTitle = `${t('versions')} - ${doc[useAsTitle]} - ${entityLabel}`;
    metaDesc = t('viewingVersions', { documentTitle: doc[useAsTitle], entityLabel });
    heading = doc?.[useAsTitle] || `[${t('general:untitled')}]`;
  }

  if (global) {
    metaTitle = `${t('versions')} - ${entityLabel}`;
    metaDesc = t('viewingVersionsGlobal', { entityLabel });
    heading = entityLabel;
    useIDLabel = false;
  }

  return (
    <React.Fragment>
      <LoadingOverlayToggle
        name="versions"
        show={isLoadingVersions}
      />
      <div className={baseClass}>
        <Meta
          description={metaDesc}
          title={metaTitle}
        />
        <Eyebrow />
        <Gutter className={`${baseClass}__wrap`}>
          <header className={`${baseClass}__header`}>
            <div className={`${baseClass}__intro`}>{t('showingVersionsFor')}</div>
            {useIDLabel && (
              <IDLabel id={doc?.id} />
            )}
            {!useIDLabel && (
              <h1>
                {heading}
              </h1>
            )}
          </header>

          {versionsData?.totalDocs > 0 && (
            <React.Fragment>
              <Table
                columns={buildVersionColumns(
                  collection,
                  global,
                  t,
                )}
                data={versionsData?.docs}
              />
              <div className={`${baseClass}__page-controls`}>
                <Paginator
                  hasNextPage={versionsData.hasNextPage}
                  hasPrevPage={versionsData.hasPrevPage}
                  limit={versionsData.limit}
                  nextPage={versionsData.nextPage}
                  numberOfNeighbors={1}
                  page={versionsData.page}
                  prevPage={versionsData.prevPage}
                  totalPages={versionsData.totalPages}
                />
                {versionsData?.totalDocs > 0 && (
                  <React.Fragment>
                    <div className={`${baseClass}__page-info`}>
                      {(versionsData.page * versionsData.limit) - (versionsData.limit - 1)}
                      -
                      {versionsData.totalPages > 1 && versionsData.totalPages !== versionsData.page ? (versionsData.limit * versionsData.page) : versionsData.totalDocs}
                      {' '}
                      {t('of')}
                      {' '}
                      {versionsData.totalDocs}
                    </div>
                    <PerPage
                      limit={limit ? Number(limit) : 10}
                      limits={collection?.admin?.pagination?.limits}
                    />
                  </React.Fragment>
                )}
              </div>
            </React.Fragment>
          )}
          {versionsData?.totalDocs === 0 && (
            <div className={`${baseClass}__no-versions`}>
              {t('noFurtherVersionsFound')}
            </div>
          )}
        </Gutter>
      </div>
    </React.Fragment>
  );
};

export default Versions;
