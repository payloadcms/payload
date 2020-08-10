import React, { useState, useEffect } from 'react';
import config from 'payload/config';
import { useLocation } from 'react-router-dom';
import { useStepNav } from '../../elements/StepNav';
import { useUser } from '../../data/User';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import DefaultAccount from './Default';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';

import RenderCustomComponent from '../../utilities/RenderCustomComponent';

const { serverURL, routes: { api }, collections } = config;

const AccountView = () => {
  const { state: locationState } = useLocation();
  const { setStepNav } = useStepNav();
  const { user, permissions } = useUser();
  const [initialState, setInitialState] = useState({});

  const collection = collections.find((coll) => coll.slug === user.collection);

  const { fields } = collection;

  const collectionPermissions = permissions?.[user?.collection];

  const [{ data, isLoading }] = usePayloadAPI(
    `${serverURL}${api}/${collection?.slug}/${user?.id}?depth=0`,
    { initialParams: { 'fallback-locale': 'null' } },
  );

  const hasSavePermission = collectionPermissions?.update?.permission;
  const dataToRender = locationState?.data || data;
  const apiURL = `${serverURL}${api}/${user.collection}/${data?.id}`;

  useEffect(() => {
    const nav = [{
      label: 'Account',
    }];

    setStepNav(nav);
  }, [setStepNav]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema(fields, dataToRender);
      setInitialState(state);
    };

    awaitInitialState();
  }, [dataToRender, fields]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultAccount}
      path="account"
      componentProps={{
        data,
        collection,
        permissions: collectionPermissions,
        hasSavePermission,
        initialState,
        apiURL,
        isLoading,
      }}
    />
  );
};

export default AccountView;
