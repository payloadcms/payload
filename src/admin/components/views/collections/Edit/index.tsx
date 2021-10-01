import React, { useState, useEffect } from 'react';
import { Redirect, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import { useConfig, useAuth } from '@payloadcms/config-provider';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';

import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import { DocumentInfoProvider } from '../../../utilities/DocumentInfo';
import DefaultEdit from './Default';
import formatFields from './formatFields';
import buildStateFromSchema from '../../../forms/Form/buildStateFromSchema';
import { NegativeFieldGutterProvider } from '../../../forms/FieldTypeGutter/context';
import { useLocale } from '../../../utilities/Locale';
import { IndexProps } from './types';
import { StepNavItem } from '../../../elements/StepNav/types';

const EditView: React.FC<IndexProps> = (props) => {
  const { collection, isEditing } = props;

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
  } = collection;
  const [fields] = useState(() => formatFields(collection, isEditing));

  const locale = useLocale();
  const { serverURL, routes: { admin, api } } = useConfig();
  const { params: { id } = {} } = useRouteMatch<Record<string, string>>();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [initialState, setInitialState] = useState({});
  const { permissions } = useAuth();

  const onSave = async (json) => {
    if (!isEditing) {
      history.push(`${admin}/collections/${collection.slug}/${json?.doc?.id}`);
    } else {
      const state = await buildStateFromSchema(fields, json.doc);
      setInitialState(state);
    }
  };

  const [{ data, isLoading, isError }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0 } },
  );

  const dataToRender = (locationState as Record<string, unknown>)?.data || data;

  useEffect(() => {
    const nav: StepNavItem[] = [{
      url: `${admin}/collections/${slug}`,
      label: pluralLabel,
    }];

    if (isEditing) {
      nav.push({
        label: dataToRender ? dataToRender[useAsTitle || 'id'] : '',
      });
    } else {
      nav.push({
        label: 'Create New',
      });
    }

    setStepNav(nav);
  }, [setStepNav, isEditing, pluralLabel, dataToRender, slug, useAsTitle, admin]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema(fields, dataToRender);
      setInitialState(state);
    };

    awaitInitialState();
  }, [dataToRender, fields]);

  if (isError) {
    return (
      <Redirect to={`${admin}/not-found`} />
    );
  }

  const collectionPermissions = permissions?.collections?.[slug];

  const apiURL = `${serverURL}${api}/${slug}/${id}`;
  const action = `${serverURL}${api}/${slug}${isEditing ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`;
  const hasSavePermission = (isEditing && collectionPermissions?.update?.permission) || (!isEditing && collectionPermissions?.create?.permission);

  return (
    <DocumentInfoProvider
      id={id}
      slug={collection.slug}
      type="collection"
    >
      <NegativeFieldGutterProvider allow>
        <RenderCustomComponent
          DefaultComponent={DefaultEdit}
          CustomComponent={CustomEdit}
          componentProps={{
            isLoading,
            data: dataToRender,
            collection: { ...collection, fields },
            permissions: collectionPermissions,
            isEditing,
            onSave,
            initialState,
            hasSavePermission,
            apiURL,
            action,
          }}
        />
      </NegativeFieldGutterProvider>
    </DocumentInfoProvider>
  );
};
export default EditView;
