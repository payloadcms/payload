import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useConfig, useAuth } from '@payloadcms/config-provider';
import { useStepNav } from '../../elements/StepNav';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import { DocumentInfoProvider } from '../../utilities/DocumentInfo';

import { useLocale } from '../../utilities/Locale';

import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultGlobal from './Default';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { NegativeFieldGutterProvider } from '../../forms/FieldTypeGutter/context';
import { IndexProps } from './types';

const GlobalView: React.FC<IndexProps> = (props) => {
  const { state: locationState } = useLocation<{data?: Record<string, unknown>}>();
  const history = useHistory();
  const locale = useLocale();
  const { setStepNav } = useStepNav();
  const { permissions } = useAuth();
  const [initialState, setInitialState] = useState({});

  const {
    serverURL,
    routes: {
      admin,
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

  const onSave = (json) => {
    history.push(`${admin}/globals/${global.slug}`, {
      status: {
        message: json.message,
        type: 'success',
      },
      data: json.doc,
    });
  };

  const [{ data }] = usePayloadAPI(
    `${serverURL}${api}/globals/${slug}`,
    { initialParams: { 'fallback-locale': 'null', depth: 0 } },
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
      const state = await buildStateFromSchema(fields, dataToRender);
      setInitialState(state);
    };

    awaitInitialState();
  }, [dataToRender, fields]);

  const globalPermissions = permissions?.globals?.[slug];

  return (
    <DocumentInfoProvider
      slug={slug}
      type="global"
    >
      <NegativeFieldGutterProvider allow>
        <RenderCustomComponent
          DefaultComponent={DefaultGlobal}
          CustomComponent={CustomEdit}
          componentProps={{
            data: dataToRender,
            permissions: globalPermissions,
            initialState,
            global,
            onSave,
            apiURL: `${serverURL}${api}/globals/${slug}?depth=0`,
            action: `${serverURL}${api}/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`,
          }}
        />
      </NegativeFieldGutterProvider>
    </DocumentInfoProvider>
  );
};
export default GlobalView;
