import { useAuth, useConfig } from '@payloadcms/config-provider';
import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import format from 'date-fns/format';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import Loading from '../../elements/Loading';
import { useStepNav } from '../../elements/StepNav';
import { StepNavItem } from '../../elements/StepNav/types';
import Meta from '../../utilities/Meta';
import { LocaleOption, CompareOption, Props } from './types';
import CompareRevision from './Compare';
import { publishedVersionOption } from './shared';
import Restore from './Restore';
import SelectLocales from './SelectLocales';
import RenderFieldsToDiff from './RenderFieldsToDiff';

import './index.scss';
import { Field } from '../../../../fields/config/types';
import { FieldPermissions } from '../../../../auth';

const baseClass = 'view-revision';

const ViewRevision: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api }, admin: { dateFormat }, localization } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id, revisionID } } = useRouteMatch<{ id?: string, revisionID: string }>();
  const [compareValue, setCompareValue] = useState<CompareOption>(publishedVersionOption);
  const [localeOptions] = useState<LocaleOption[]>(() => (localization?.locales ? localization.locales.map((locale) => ({ label: locale, value: locale })) : []));
  const [locales, setLocales] = useState<LocaleOption[]>(localeOptions);
  const { permissions } = useAuth();

  let originalDocFetchURL: string;
  let revisionFetchURL: string;
  let entityLabel: string;
  let fields: Field[];
  let fieldPermissions: Record<string, FieldPermissions>;
  let compareBaseURL: string;
  let slug: string;
  let parentID: string;

  if (collection) {
    ({ slug } = collection);
    originalDocFetchURL = `${serverURL}${api}/${slug}/${id}`;
    revisionFetchURL = `${serverURL}${api}/${slug}/revisions/${revisionID}`;
    compareBaseURL = `${serverURL}${api}/${slug}/revisions`;
    entityLabel = collection.labels.singular;
    parentID = id;
    fields = collection.fields;
    fieldPermissions = permissions.collections[collection.slug].fields;
  }

  if (global) {
    ({ slug } = global);
    originalDocFetchURL = `${serverURL}${api}/globals/${slug}`;
    revisionFetchURL = `${serverURL}${api}/globals/${slug}/revisions/${revisionID}`;
    compareBaseURL = `${serverURL}${api}/globals/${slug}/revisions`;
    entityLabel = global.label;
    fields = global.fields;
    fieldPermissions = permissions.globals[global.slug].fields;
  }

  const useAsTitle = collection?.admin?.useAsTitle || 'id';
  const compareFetchURL = compareValue?.value === 'published' ? originalDocFetchURL : `${compareBaseURL}/${compareValue.value}`;

  const [{ data: doc, isLoading }] = usePayloadAPI(revisionFetchURL, { initialParams: { locale: '*' } });
  const [{ data: originalDoc }] = usePayloadAPI(originalDocFetchURL);
  const [{ data: compareDoc }] = usePayloadAPI(compareFetchURL, { initialParams: { locale: '*' } });

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
        <div className={`${baseClass}__intro`}>Revision created on:</div>
        <header className={`${baseClass}__header`}>
          <h2>
            {formattedCreatedAt}
          </h2>
          <Restore
            className={`${baseClass}__restore`}
            collection={collection}
            global={global}
          />
        </header>
        <div className={`${baseClass}__controls`}>
          {localization && (
            <SelectLocales
              onChange={setLocales}
              options={localeOptions}
              value={locales}
            />
          )}
          <CompareRevision
            baseURL={compareBaseURL}
            parentID={parentID}
            value={compareValue}
            onChange={setCompareValue}
          />
        </div>
        {isLoading && (
          <Loading />
        )}
        {doc?.revision && (
          <RenderFieldsToDiff
            locales={locales.map((locale) => locale.value)}
            fields={fields}
            fieldPermissions={fieldPermissions}
            revision={doc?.revision}
            comparison={compareValue?.value === 'published' ? compareDoc : compareDoc?.revision}
          />
        )}
      </div>
    </div>
  );
};

export default ViewRevision;
