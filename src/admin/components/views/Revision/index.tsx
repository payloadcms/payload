import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import format from 'date-fns/format';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import Loading from '../../elements/Loading';
import { useStepNav } from '../../elements/StepNav';
import { StepNavItem } from '../../elements/StepNav/types';
import Meta from '../../utilities/Meta';
import { Props } from './types';
import CompareRevision from './Compare';
import { Option } from './Compare/types';

import './index.scss';

const baseClass = 'view-revision';

const ViewRevision: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api }, admin: { dateFormat } } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id, revisionID } } = useRouteMatch<{ id?: string, revisionID: string }>();
  const [compareValue, setCompareValue] = useState<Option>();

  let originalDocFetchURL: string;
  let revisionFetchURL: string;
  let entityLabel: string;
  let compareBaseURL: string;
  let slug: string;

  if (collection) {
    ({ slug } = collection);
    originalDocFetchURL = `${serverURL}${api}/${slug}/${id}`;
    revisionFetchURL = `${serverURL}${api}/${slug}/revisions/${revisionID}`;
    compareBaseURL = `${serverURL}${api}/${slug}/revisions`;
    entityLabel = collection.labels.singular;
  }

  if (global) {
    ({ slug } = global);
    originalDocFetchURL = `${serverURL}${api}/globals/${slug}`;
    revisionFetchURL = `${serverURL}${api}/globals/${slug}/revisions/${revisionID}`;
    compareBaseURL = `${serverURL}${api}/globals/${slug}/revisions`;
    entityLabel = global.label;
  }

  const useAsTitle = collection?.admin?.useAsTitle || 'id';
  const compareFetchURL = compareValue?.value ? `${compareBaseURL}/${compareValue.value}/${compareValue?.value}` : '';

  const [{ data: doc, isLoading }] = usePayloadAPI(revisionFetchURL);
  const [{ data: originalDoc }] = usePayloadAPI(originalDocFetchURL);
  const [{ data: compareDoc }] = usePayloadAPI(compareFetchURL);

  useEffect(() => {
    let nav: StepNavItem[] = [];

    if (collection) {
      nav = [
        {
          url: `${admin}/collections/${collection.slug}`,
          label: collection.labels.plural,
        },
        {
          label: originalDoc ? originalDoc[useAsTitle] : '',
          url: `${admin}/collections/${collection.slug}/${id}`,
        },
        {
          label: 'Revisions',
          url: `${admin}/collections/${collection.slug}/${id}/revisions`,
        },
        {
          label: doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : '',
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
          url: `${admin}/globals/${global.slug}/revisions`,
        },
        {
          label: doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : '',
        },
      ];
    }

    setStepNav(nav);
  }, [setStepNav, collection, global, useAsTitle, dateFormat, doc, originalDoc, admin, id]);

  let metaTitle: string;
  let metaDesc: string;
  const formattedCreatedAt = doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : '';

  if (collection) {
    metaTitle = `Revision - ${formattedCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`;
    metaDesc = `Viewing revision for the ${entityLabel} ${doc[useAsTitle]}`;
  }

  if (global) {
    metaTitle = `Revision - ${formattedCreatedAt} - ${entityLabel}`;
    metaDesc = `Viewing revision for the global ${entityLabel}`;
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
          <div className={`${baseClass}__intro`}>Revision created on:</div>
          <h2>
            {formattedCreatedAt}
          </h2>
        </header>
        <div className={`${baseClass}__controls`}>
          <CompareRevision
            baseURL={compareBaseURL}
            value={compareValue}
            onChange={setCompareValue}
          />
        </div>
        {isLoading && (
          <Loading />
        )}
        {doc?.revision && (
          <React.Fragment>
            hello
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default ViewRevision;
