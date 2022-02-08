import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useConfig, useAuth } from '@payloadcms/config-provider';
import { useStepNav } from '../../elements/StepNav';
import usePayloadAPI from '../../../hooks/usePayloadAPI';

import { useLocale } from '../../utilities/Locale';

import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultGlobal from './Default';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { NegativeFieldGutterProvider } from '../../forms/FieldTypeGutter/context';
import { IndexProps } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';

const GlobalView: React.FC<IndexProps> = (props) => {
  const { state: locationState } = useLocation<{data?: Record<string, unknown>}>();
  const locale = useLocale();
  const { setStepNav } = useStepNav();
  const { permissions } = useAuth();
  const [initialState, setInitialState] = useState({});
  const { getVersions } = useDocumentInfo();

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
    const state = await buildStateFromSchema(fields, json.result);
    setInitialState(state);
  }, [getVersions, fields]);

  const [{ data, isLoading }] = usePayloadAPI(
    `${serverURL}${api}/globals/${slug}`,
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } },
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
    <NegativeFieldGutterProvider allow>
      <RenderCustomComponent
        DefaultComponent={DefaultGlobal}
        CustomComponent={CustomEdit}
        componentProps={{
          isLoading,
          data: dataToRender,
          permissions: globalPermissions,
          initialState,
          global,
          onSave,
          apiURL: `${serverURL}${api}/globals/${slug}${global.versions?.drafts ? '?draft=true' : ''}`,
          action: `${serverURL}${api}/globals/${slug}?locale=${locale}&depth=0&fallback-locale=null`,
        }}
      />
    </NegativeFieldGutterProvider>
  );
};
export default GlobalView;
