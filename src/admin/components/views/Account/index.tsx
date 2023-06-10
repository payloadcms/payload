import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import { useStepNav } from '../../elements/StepNav';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { useLocale } from '../../utilities/Locale';
import DefaultAccount from './Default';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { Fields } from '../../forms/Form/types';
import { usePreferences } from '../../utilities/Preferences';

const AccountView: React.FC = () => {
  const { state: locationState } = useLocation<{ data: unknown }>();
  const locale = useLocale();
  const { setStepNav } = useStepNav();
  const { user } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const { id, preferencesKey, docPermissions, getDocPermissions, slug, getDocPreferences } = useDocumentInfo();
  const { getPreference } = usePreferences();

  const {
    serverURL,
    routes: { api },
    collections,
    admin: {
      components: {
        views: {
          Account: CustomAccount,
        } = {
          Account: undefined,
        },
      } = {},
    },
  } = useConfig();
  const { t } = useTranslation('authentication');

  const collection = collections.find((coll) => coll.slug === slug);

  const { fields } = collection;

  const [{ data, isLoading: isLoadingData }] = usePayloadAPI(
    `${serverURL}${api}/${slug}/${id}`,
    {
      initialParams: {
        'fallback-locale': 'null',
        depth: 0,
      },
      initialData: null,
    },
  );

  const hasSavePermission = docPermissions?.update?.permission;
  const dataToRender = locationState?.data || data;
  const apiURL = `${serverURL}${api}/${slug}/${data?.id}`;

  const action = `${serverURL}${api}/${slug}/${data?.id}?locale=${locale}&depth=0`;

  const onSave = React.useCallback(async (json: any) => {
    getDocPermissions();
    const preferences = await getDocPreferences();
    const state = await buildStateFromSchema({ fieldSchema: collection.fields, preferences, data: json.doc, user, id, operation: 'update', locale, t });
    setInitialState(state);
  }, [collection, user, id, t, locale, getDocPermissions, getDocPreferences]);

  useEffect(() => {
    const nav = [{
      label: t('account'),
    }];

    setStepNav(nav);
  }, [setStepNav, t]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const preferences = await getDocPreferences();
      const state = await buildStateFromSchema({
        fieldSchema: fields,
        preferences,
        data: dataToRender,
        operation: 'update',
        id,
        user,
        locale,
        t,
      });
      await getPreference(preferencesKey);
      setInitialState(state);
    };

    if (dataToRender) awaitInitialState();
  }, [dataToRender, fields, id, user, locale, preferencesKey, getPreference, t, getDocPreferences]);

  const isLoading = !initialState || !docPermissions || isLoadingData;

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultAccount}
      CustomComponent={CustomAccount}
      componentProps={{
        action,
        data,
        collection,
        permissions: docPermissions,
        hasSavePermission,
        initialState,
        apiURL,
        isLoading,
        onSave,
      }}
    />
  );
};

export default AccountView;
