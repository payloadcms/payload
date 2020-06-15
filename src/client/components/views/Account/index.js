import React, { useState, useEffect } from 'react';
import config from 'payload/config';
import { useStepNav } from '../../elements/StepNav';
import { useUser } from '../../data/User';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import formatFields from '../collections/Edit/formatFields';
import DefaultAccount from './Default';


import RenderCustomComponent from '../../utilities/RenderCustomComponent';

const { serverURL, routes: { api } } = config;

const AccountView = () => {
  const { setStepNav } = useStepNav();
  const [fields, setFields] = useState([]);
  const { user } = useUser();

  const collection = config.collections.find(coll => coll.slug === user?.collection);

  const [{ data }] = usePayloadAPI(
    `${serverURL}${api}/${collection?.slug}/${user?.id}`,
    { initialParams: { 'fallback-locale': 'null' } },
  );

  useEffect(() => {
    const nav = [{
      label: 'Account',
    }];

    setStepNav(nav);
  }, [setStepNav]);

  useEffect(() => {
    setFields(formatFields(collection));
  }, [collection]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultAccount}
      path="account"
      componentProps={{
        data,
        collection: { ...collection, fields },
      }}
    />
  );
};

export default AccountView;
