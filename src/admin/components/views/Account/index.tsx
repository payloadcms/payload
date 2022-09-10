import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { user, permissions } = useAuth();
  const [initialState, setInitialState] = useState<Fields>();
  const { id, preferencesKey } = useDocumentInfo();
  const { getPreference } = usePreferences();

  const {
    serverURL,
    routes: { api },
    collections,
    admin: {
      user: adminUser,
      components: {
        views: {
          Account: CustomAccount,
        } = {
          Account: undefined,
        },
      } = {},
    } = {
      user: 'users',
    },
  } = useConfig();

  const collection = collections.find((coll) => coll.slug === adminUser);

  const { fields } = collection;

  const collectionPermissions = permissions?.collections?.[adminUser];

  const [{ data }] = usePayloadAPI(
    `${serverURL}${api}/${collection?.slug}/${user?.id}?depth=0`,
    { initialParams: { 'fallback-locale': 'null' } },
  );

  const hasSavePermission = collectionPermissions?.update?.permission;
  const dataToRender = locationState?.data || data;
  const apiURL = `${serverURL}${api}/${user.collection}/${data?.id}`;

  const action = `${serverURL}${api}/${user.collection}/${data?.id}?locale=${locale}&depth=0`;

  useEffect(() => {
    const nav = [{
      label: 'Account',
    }];

    setStepNav(nav);
  }, [setStepNav]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema({ fieldSchema: fields, data: dataToRender, operation: 'update', id, user, locale });
      await getPreference(preferencesKey);
      setInitialState(state);
    };

    awaitInitialState();
  }, [dataToRender, fields, id, user, locale, preferencesKey, getPreference]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultAccount}
      CustomComponent={CustomAccount}
      componentProps={{
        action,
        data,
        collection,
        permissions: collectionPermissions,
        hasSavePermission,
        initialState,
        apiURL,
        isLoading: !initialState,
      }}
    />
  );
};

export default AccountView;
