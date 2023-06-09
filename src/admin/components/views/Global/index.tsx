import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import { useStepNav } from '../../elements/StepNav';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { useLocale } from '../../utilities/Locale';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultGlobal from './Default';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { IndexProps } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { Fields } from '../../forms/Form/types';
import { usePreferences } from '../../utilities/Preferences';

const GlobalView: React.FC<IndexProps> = (props) => {
  const { state: locationState } = useLocation<{ data?: Record<string, unknown> }>();
  const locale = useLocale();
  const { setStepNav } = useStepNav();
  const { user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const [updatedAt, setUpdatedAt] = useState<string>();
  const { getVersions, preferencesKey, docPermissions, getDocPermissions, getDocPreferences } = useDocumentInfo();
  const { getPreference } = usePreferences();
  const { t } = useTranslation();

  const {
    serverURL,
    routes: {
      api,
    },
  } = useConfig();

  const { global } = props;

  const {
    slug,
    label,
    fields,
    admin: {
      components: {
        views: {
          Edit: CustomEdit,
        } = {},
      } = {},
    } = {},
  } = global;

  const onSave = useCallback(async (json) => {
    getVersions();
    getDocPermissions();
    setUpdatedAt(json?.result?.updatedAt);
    const preferences = await getDocPreferences();
    const state = await buildStateFromSchema({ fieldSchema: fields, preferences, data: json.result, operation: 'update', user, locale, t });
    setInitialState(state);
  }, [getVersions, fields, user, locale, t, getDocPermissions, getDocPreferences]);

  const [{ data, isLoading: isLoadingData }] = usePayloadAPI(
    `${serverURL}${api}/globals/${slug}`,
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' }, initialData: null },
  );

  const dataToRender = locationState?.data || data;

  useEffect(() => {
    const nav = [{
      label,
    }];

    setStepNav(nav);
  }, [setStepNav, label]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences();
      const state = await buildStateFromSchema({ fieldSchema: fields, preferences, data: dataToRender, user, operation: 'update', locale, t });
      await getPreference(preferencesKey);
      setInitialState(state);
    };

    if (dataToRender) awaitInitialState();
  }, [dataToRender, fields, user, locale, getPreference, preferencesKey, t, getDocPreferences]);

  const isLoading = !initialState || !docPermissions || isLoadingData;

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultGlobal}
      CustomComponent={CustomEdit}
      componentProps={{
        isLoading,
        data: dataToRender,
        permissions: docPermissions,
        initialState,
        global,
        onSave,
        apiURL: `${serverURL}${api}/globals/${slug}${global.versions?.drafts ? '?draft=true' : ''}`,
        action: `${serverURL}${api}/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`,
        updatedAt: updatedAt || dataToRender?.updatedAt,
      }}
    />
  );
};
export default GlobalView;
