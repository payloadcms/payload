import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import { LoadingOverlayToggle } from '../../elements/Loading';
import { useStepNav } from '../../elements/StepNav';
import { StepNavItem } from '../../elements/StepNav/types';
import Meta from '../../utilities/Meta';
import { Props } from './types';
import IDLabel from '../../elements/IDLabel';
import { Table } from '../../elements/Table';
import Paginator from '../../elements/Paginator';
import PerPage from '../../elements/PerPage';
import { useSearchParams } from '../../utilities/SearchParams';
import { Gutter } from '../../elements/Gutter';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'versions';

const Versions: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api } } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id } } = useRouteMatch<{ id: string }>();
  const { t, i18n } = useTranslation('version');
  const [fetchURL, setFetchURL] = useState('');
  const { page, sort, limit } = useSearchParams();

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
          url: `${admin}/collections/${collection.slug}`,
          label: getTranslation(collection.labels.plural, i18n),
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
          url: editURL,
          label: getTranslation(global.label, i18n),
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
        show={isLoadingVersions}
        name="versions"
      />
      <div className={baseClass}>
        <Meta
          title={metaTitle}
          description={metaDesc}
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
              <Table data={versionsData?.docs} />
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
                      {t('of')}
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
