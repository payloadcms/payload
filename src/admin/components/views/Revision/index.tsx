import { useConfig } from '@payloadcms/config-provider';
import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import format from 'date-fns/format';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import Loading from '../../elements/Loading';
import { useStepNav } from '../../elements/StepNav';
import { StepNavItem } from '../../elements/StepNav/types';
import Meta from '../../utilities/Meta';
import { Props } from './types';
import IDLabel from '../../elements/IDLabel';

import './index.scss';

const baseClass = 'view-revision';

const ViewRevision: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api }, admin: { dateFormat } } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id, revisionID } } = useRouteMatch<{ id?: string, revisionID: string }>();

  let originalDocFetchURL: string;
  let docFetchURL: string;
  let entityLabel: string;
  let slug: string;

  if (collection) {
    ({ slug } = collection);
    originalDocFetchURL = `${serverURL}${api}/${slug}/${id}`;
    docFetchURL = `${serverURL}${api}/${slug}/revisions/${revisionID}`;
    entityLabel = collection.labels.singular;
  }

  if (global) {
    ({ slug } = global);
    docFetchURL = `${serverURL}${api}/globals/${slug}/revisions/${revisionID}`;
    entityLabel = global.label;
  }

  const useAsTitle = collection?.admin?.useAsTitle || 'id';
  const [{ data: doc, isLoading }] = usePayloadAPI(docFetchURL);
  const [{ data: originalDoc }] = usePayloadAPI(originalDocFetchURL);

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

  if (collection) {
    metaTitle = `Revision - ${doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : ''} - ${doc[useAsTitle]} - ${entityLabel}`;
    metaDesc = `Viewing revision for the ${entityLabel} ${doc[useAsTitle]}`;
  }

  if (global) {
    metaTitle = `Revision - ${doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : ''} - ${entityLabel}`;
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
          <IDLabel
            id={doc?.id}
            prefix="Revision"
          />
        </header>
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
