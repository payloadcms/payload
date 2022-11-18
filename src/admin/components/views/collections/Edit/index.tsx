import React, { useState, useEffect, useCallback } from 'react';
import { Redirect, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../utilities/Config';
import { useAuth } from '../../../utilities/Auth';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';

import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import DefaultEdit from './Default';
import formatFields from './formatFields';
import buildStateFromSchema from '../../../forms/Form/buildStateFromSchema';
import { useLocale } from '../../../utilities/Locale';
import { IndexProps } from './types';
import { StepNavItem } from '../../../elements/StepNav/types';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { Fields } from '../../../forms/Form/types';
import { usePreferences } from '../../../utilities/Preferences';
import { EditDepthContext } from '../../../utilities/EditDepth';
import { getTranslation } from '../../../../../utilities/getTranslation';

const EditView: React.FC<IndexProps> = (props) => {
  const { collection: incomingCollection, isEditing } = props;

  const {
    slug,
    labels: {
      plural: pluralLabel,
    },
    admin: {
      useAsTitle,
      components: {
        views: {
          Edit: CustomEdit,
        } = {},
      } = {},
    } = {},
  } = incomingCollection;

  const [fields] = useState(() => formatFields(incomingCollection, isEditing));
  const [collection] = useState(() => ({ ...incomingCollection, fields }));
  const [redirect, setRedirect] = useState<string>();

  const locale = useLocale();
  const { serverURL, routes: { admin, api } } = useConfig();
  const { params: { id } = {} } = useRouteMatch<Record<string, string>>();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [initialState, setInitialState] = useState<Fields>();
  const { permissions, user } = useAuth();
  const { getVersions, preferencesKey } = useDocumentInfo();
  const { getPreference } = usePreferences();
  const { t, i18n } = useTranslation('general');

  const onSave = useCallback(async (json: any) => {
    getVersions();
    if (!isEditing) {
      setRedirect(`${admin}/collections/${collection.slug}/${json?.doc?.id}`);
    } else {
      const state = await buildStateFromSchema({ fieldSchema: collection.fields, data: json.doc, user, id, operation: 'update', locale, t });
      setInitialState(state);
    }
  }, [admin, collection, isEditing, getVersions, user, id, t, locale]);

  const [{ data, isLoading: isLoadingDocument, isError }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } },
  );

  const dataToRender = (locationState as Record<string, unknown>)?.data || data;

  useEffect(() => {
    const nav: StepNavItem[] = [{
      url: `${admin}/collections/${slug}`,
      label: getTranslation(pluralLabel, i18n),
    }];

    if (isEditing) {
      let label = '';

      if (dataToRender) {
        if (useAsTitle) {
          if (dataToRender[useAsTitle]) {
            label = dataToRender[useAsTitle];
          } else {
            label = `[${t('untitled')}]`;
          }
        } else {
          label = dataToRender.id;
        }
      }

      nav.push({
        label,
      });
    } else {
      nav.push({
        label: t('createNew'),
      });
    }

    setStepNav(nav);
  }, [setStepNav, isEditing, pluralLabel, dataToRender, slug, useAsTitle, admin, t, i18n]);

  useEffect(() => {
    if (isLoadingDocument) {
      return;
    }
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema({ fieldSchema: fields, data: dataToRender, user, operation: isEditing ? 'update' : 'create', id, locale, t });
      await getPreference(preferencesKey);
      setInitialState(state);
    };

    awaitInitialState();
  }, [dataToRender, fields, isEditing, id, user, locale, isLoadingDocument, preferencesKey, getPreference, t]);

  useEffect(() => {
    if (redirect) {
      history.push(redirect);
    }
  }, [history, redirect]);

  if (isError) {
    return (
      <Redirect to={`${admin}/not-found`} />
    );
  }

  const collectionPermissions = permissions?.collections?.[slug];
  const apiURL = `${serverURL}${api}/${slug}/${id}${collection.versions.drafts ? '?draft=true' : ''}`;
  const action = `${serverURL}${api}/${slug}${isEditing ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`;
  const hasSavePermission = (isEditing && collectionPermissions?.update?.permission) || (!isEditing && collectionPermissions?.create?.permission);

  return (
    <EditDepthContext.Provider value={1}>
      <RenderCustomComponent
        DefaultComponent={DefaultEdit}
        CustomComponent={CustomEdit}
        componentProps={{
          id,
          isLoading: !initialState,
          data: dataToRender,
          collection,
          permissions: collectionPermissions,
          isEditing,
          onSave,
          initialState,
          hasSavePermission,
          apiURL,
          action,
        }}
      />
    </EditDepthContext.Provider>
  );
};
export default EditView;
