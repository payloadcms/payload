import React, { useEffect, useState } from 'react';
import { useAuth, useConfig } from '@payloadcms/config-provider';
import { useRouteMatch } from 'react-router-dom';
import format from 'date-fns/format';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Eyebrow from '../../elements/Eyebrow';
import Loading from '../../elements/Loading';
import { useStepNav } from '../../elements/StepNav';
import { StepNavItem } from '../../elements/StepNav/types';
import Meta from '../../utilities/Meta';
import { LocaleOption, CompareOption, Props } from './types';
import CompareVersion from './Compare';
import { mostRecentVersionOption } from './shared';
import Restore from './Restore';
import SelectLocales from './SelectLocales';
import RenderFieldsToDiff from './RenderFieldsToDiff';
import fieldComponents from './RenderFieldsToDiff/fields';

import { Field, FieldAffectingData, fieldAffectsData } from '../../../../fields/config/types';
import { FieldPermissions } from '../../../../auth';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const baseClass = 'view-version';

const VersionView: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api }, admin: { dateFormat }, localization } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id, versionID } } = useRouteMatch<{ id?: string, versionID: string }>();
  const [compareValue, setCompareValue] = useState<CompareOption>(mostRecentVersionOption);
  const [localeOptions] = useState<LocaleOption[]>(() => (localization?.locales ? localization.locales.map((locale) => ({ label: locale, value: locale })) : []));
  const [locales, setLocales] = useState<LocaleOption[]>(localeOptions);
  const { permissions } = useAuth();
  const locale = useLocale();

  let originalDocFetchURL: string;
  let versionFetchURL: string;
  let entityLabel: string;
  let fields: Field[];
  let fieldPermissions: Record<string, FieldPermissions>;
  let compareBaseURL: string;
  let slug: string;
  let parentID: string;

  if (collection) {
    ({ slug } = collection);
    originalDocFetchURL = `${serverURL}${api}/${slug}/${id}`;
    versionFetchURL = `${serverURL}${api}/${slug}/versions/${versionID}`;
    compareBaseURL = `${serverURL}${api}/${slug}/versions`;
    entityLabel = collection.labels.singular;
    parentID = id;
    fields = collection.fields;
    fieldPermissions = permissions.collections[collection.slug].fields;
  }

  if (global) {
    ({ slug } = global);
    originalDocFetchURL = `${serverURL}${api}/globals/${slug}`;
    versionFetchURL = `${serverURL}${api}/globals/${slug}/versions/${versionID}`;
    compareBaseURL = `${serverURL}${api}/globals/${slug}/versions`;
    entityLabel = global.label;
    fields = global.fields;
    fieldPermissions = permissions.globals[global.slug].fields;
  }

  const compareFetchURL = compareValue?.value === 'mostRecent' || compareValue?.value === 'published' ? originalDocFetchURL : `${compareBaseURL}/${compareValue.value}`;

  const [{ data: doc, isLoading }] = usePayloadAPI(versionFetchURL, { initialParams: { locale: '*', depth: 1 } });
  const [{ data: publishedDoc }] = usePayloadAPI(originalDocFetchURL, { initialParams: { locale: '*', depth: 1 } });
  const [{ data: mostRecentDoc }] = usePayloadAPI(originalDocFetchURL, { initialParams: { locale: '*', depth: 1, draft: true } });
  const [{ data: compareDoc }] = usePayloadAPI(compareFetchURL, { initialParams: { locale: '*', depth: 1, draft: 'true' } });

  useEffect(() => {
    let nav: StepNavItem[] = [];

    if (collection) {
      let docLabel = '';

      if (mostRecentDoc) {
        const { useAsTitle } = collection.admin;

        if (useAsTitle !== 'id') {
          const titleField = collection.fields.find((field) => fieldAffectsData(field) && field.name === useAsTitle) as FieldAffectingData;

          if (titleField && mostRecentDoc[useAsTitle]) {
            if (titleField.localized) {
              docLabel = mostRecentDoc[useAsTitle]?.[locale];
            } else {
              docLabel = mostRecentDoc[useAsTitle];
            }
          } else {
            docLabel = '[Untitled]';
          }
        } else {
          docLabel = mostRecentDoc.id;
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
          url: `${admin}/collections/${collection.slug}/${id}/versions`,
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
          label: 'Versions',
          url: `${admin}/globals/${global.slug}/versions`,
        },
        {
          label: doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : '',
        },
      ];
    }

    setStepNav(nav);
  }, [setStepNav, collection, global, dateFormat, doc, mostRecentDoc, admin, id, locale]);

  let metaTitle: string;
  let metaDesc: string;
  const formattedCreatedAt = doc?.createdAt ? format(new Date(doc.createdAt), dateFormat) : '';

  if (collection) {
    const useAsTitle = collection?.admin?.useAsTitle || 'id';
    metaTitle = `Version - ${formattedCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`;
    metaDesc = `Viewing version for the ${entityLabel} ${doc[useAsTitle]}`;
  }

  if (global) {
    metaTitle = `Version - ${formattedCreatedAt} - ${entityLabel}`;
    metaDesc = `Viewing version for the global ${entityLabel}`;
  }

  let comparison = compareDoc?.version;

  if (compareValue?.value === 'mostRecent') {
    comparison = mostRecentDoc;
  }

  if (compareValue?.value === 'published') {
    comparison = publishedDoc;
  }

  return (
    <div className={baseClass}>
      <Meta
        title={metaTitle}
        description={metaDesc}
      />
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__intro`}>
          {doc?.autosave ? 'Autosaved version ' : 'Version'}
          {' '}
          created on:
        </div>
        <header className={`${baseClass}__header`}>
          <h2>
            {formattedCreatedAt}
          </h2>
          <Restore
            className={`${baseClass}__restore`}
            collection={collection}
            global={global}
            originalDocID={id}
            versionID={versionID}
            versionDate={formattedCreatedAt}
          />
        </header>
        <div className={`${baseClass}__controls`}>
          <CompareVersion
            versionID={versionID}
            baseURL={compareBaseURL}
            parentID={parentID}
            value={compareValue}
            onChange={setCompareValue}
          />
          {localization && (
            <SelectLocales
              onChange={setLocales}
              options={localeOptions}
              value={locales}
            />
          )}
        </div>
        {isLoading && (
          <Loading />
        )}
        {doc?.version && (
          <RenderFieldsToDiff
            locales={locales.map(({ value }) => value)}
            fields={fields}
            fieldComponents={fieldComponents}
            fieldPermissions={fieldPermissions}
            version={doc?.version}
            comparison={comparison}
          />
        )}
      </div>
    </div>
  );
};

export default VersionView;
