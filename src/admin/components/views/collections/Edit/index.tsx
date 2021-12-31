import React, { useState, useEffect, useCallback } from 'react';
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

  const locale = useLocale();
  const { serverURL, routes: { admin, api } } = useConfig();
  const { params: { id } = {} } = useRouteMatch<Record<string, string>>();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [initialState, setInitialState] = useState({});
  const { permissions } = useAuth();

  const onSave = useCallback(async (json: any) => {
    if (!isEditing) {
      history.push(`${admin}/collections/${collection.slug}/${json?.doc?.id}`);
    } else {
      const state = await buildStateFromSchema(fields, json.doc);
      setInitialState(state);

      history.push({
        state: {
          data: json.doc,
        },
      });
    }
  }, [admin, collection, fields, history, isEditing]);

  const [{ data, isLoading, isError }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } },
  );

  const dataToRender = (locationState as Record<string, unknown>)?.data || data;

  useEffect(() => {
    const nav: StepNavItem[] = [{
      url: `${admin}/collections/${slug}`,
      label: pluralLabel,
    }];

    if (isEditing) {
      let label = '';

      if (dataToRender) {
        if (useAsTitle) {
          if (dataToRender[useAsTitle]) {
            label = dataToRender[useAsTitle];
          } else {
            label = '[Untitled]';
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
  const apiURL = `${serverURL}${api}/${slug}/${id}${collection.versions.drafts ? '?draft=true' : ''}`;
  const action = `${serverURL}${api}/${slug}${isEditing ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`;
  const hasSavePermission = (isEditing && collectionPermissions?.update?.permission) || (!isEditing && collectionPermissions?.create?.permission);
  const autosaveEnabled = collection.versions?.drafts && !collection.versions.drafts.autosave;

  return (
    <DocumentInfoProvider
      id={id}
      collection={collection}
    >
      <NegativeFieldGutterProvider allow>
        <RenderCustomComponent
          DefaultComponent={DefaultEdit}
          CustomComponent={CustomEdit}
          componentProps={{
            isLoading,
            data: dataToRender,
            collection,
            permissions: collectionPermissions,
            isEditing,
            onSave,
            initialState,
            hasSavePermission,
            apiURL,
            action,
            autosaveEnabled,
          }}
        />
      </NegativeFieldGutterProvider>
    </DocumentInfoProvider>
  );
};
export default EditView;
