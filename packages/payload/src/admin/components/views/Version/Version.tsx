import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config.js';
import { useAuth } from '../../utilities/Auth.js';
import { useDocumentInfo } from '../../utilities/DocumentInfo.js';
import usePayloadAPI from '../../../hooks/usePayloadAPI.js';
import Eyebrow from '../../elements/Eyebrow.js';
import { useStepNav } from '../../elements/StepNav.js';
import { StepNavItem } from '../../elements/StepNav/types.js';
import Meta from '../../utilities/Meta.js';
import { LocaleOption, CompareOption, Props } from './types.js';
import CompareVersion from './Compare.js';
import { mostRecentVersionOption } from './shared.js';
import Restore from './Restore.js';
import SelectLocales from './SelectLocales.js';
import RenderFieldsToDiff from './RenderFieldsToDiff.js';
import fieldComponents from './RenderFieldsToDiff/fields.js';
import { getTranslation } from '../../../../utilities/getTranslation.js';
import { Field, FieldAffectingData, fieldAffectsData } from '../../../../fields/config/types.js';
import { FieldPermissions } from '../../../../auth.js';
import { useLocale } from '../../utilities/Locale.js';
import { Gutter } from '../../elements/Gutter.js';
import { formatDate } from '../../../utilities/formatDate.js';

import './index.scss';

const baseClass = 'view-version';

const VersionView: React.FC<Props> = ({ collection, global }) => {
  const { serverURL, routes: { admin, api }, admin: { dateFormat }, localization } = useConfig();
  const { setStepNav } = useStepNav();
  const { params: { id, versionID } } = useRouteMatch<{ id?: string, versionID: string }>();
  const [compareValue, setCompareValue] = useState<CompareOption>(mostRecentVersionOption);
  const [localeOptions] = useState<LocaleOption[]>(() => (localization ? localization.locales : []));
  const [locales, setLocales] = useState<LocaleOption[]>(localeOptions);
  const { permissions } = useAuth();
  const { code: locale } = useLocale();
  const { t, i18n } = useTranslation('version');
  const { docPermissions } = useDocumentInfo();

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
    entityLabel = getTranslation(collection.labels.singular, i18n);
    parentID = id;
    fields = collection.fields;
    fieldPermissions = permissions.collections[collection.slug].fields;
  }

  if (global) {
    ({ slug } = global);
    originalDocFetchURL = `${serverURL}${api}/globals/${slug}`;
    versionFetchURL = `${serverURL}${api}/globals/${slug}/versions/${versionID}`;
    compareBaseURL = `${serverURL}${api}/globals/${slug}/versions`;
    entityLabel = getTranslation(global.label, i18n);
    fields = global.fields;
    fieldPermissions = permissions.globals[global.slug].fields;
  }

  const compareFetchURL = compareValue?.value === 'mostRecent' || compareValue?.value === 'published' ? originalDocFetchURL : `${compareBaseURL}/${compareValue.value}`;

  const [{ data: doc, isLoading: isLoadingData }] = usePayloadAPI(versionFetchURL, { initialParams: { locale: '*', depth: 1 } });
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
            docLabel = `[${t('general:untitled')}]`;
          }
        } else {
          docLabel = mostRecentDoc.id;
        }
      }

      nav = [
        {
          url: `${admin}/collections/${collection.slug}`,
          label: getTranslation(collection.labels.plural, i18n),
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
          label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
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
          label: doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '',
        },
      ];
    }

    setStepNav(nav);
  }, [setStepNav, collection, global, dateFormat, doc, mostRecentDoc, admin, id, locale, t, i18n]);

  let metaTitle: string;
  let metaDesc: string;
  const formattedCreatedAt = doc?.createdAt ? formatDate(doc.createdAt, dateFormat, i18n?.language) : '';

  if (collection) {
    const useAsTitle = collection?.admin?.useAsTitle || 'id';
    metaTitle = `${t('version')} - ${formattedCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`;
    metaDesc = t('viewingVersion', { documentTitle: doc[useAsTitle], entityLabel });
  }

  if (global) {
    metaTitle = `${t('version')} - ${formattedCreatedAt} - ${entityLabel}`;
    metaDesc = t('viewingVersionGlobal', { entityLabel });
  }

  let comparison = compareDoc?.version;

  if (compareValue?.value === 'mostRecent') {
    comparison = mostRecentDoc;
  }

  if (compareValue?.value === 'published') {
    comparison = publishedDoc;
  }

  const canUpdate = docPermissions?.update?.permission;

  return (
    <React.Fragment>
      <div className={baseClass}>
        <Meta
          title={metaTitle}
          description={metaDesc}
        />
        <Eyebrow />
        <Gutter className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__intro`}>
            {t('versionCreatedOn', { version: t(doc?.autosave ? 'autosavedVersion' : 'version') })}
          </div>
          <header className={`${baseClass}__header`}>
            <h2>
              {formattedCreatedAt}
            </h2>
            {canUpdate && (
              <Restore
                className={`${baseClass}__restore`}
                collection={collection}
                global={global}
                originalDocID={id}
                versionID={versionID}
                versionDate={formattedCreatedAt}
              />
            )}
          </header>
          <div className={`${baseClass}__controls`}>
            <CompareVersion
              publishedDoc={publishedDoc}
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

          {doc?.version && (
            <RenderFieldsToDiff
              locales={locales ? locales.map(({ code }) => code) : []}
              fields={fields}
              fieldComponents={fieldComponents}
              fieldPermissions={fieldPermissions}
              version={doc?.version}
              comparison={comparison}
            />
          )}
        </Gutter>
      </div>
    </React.Fragment>
  );
};

export default VersionView;
