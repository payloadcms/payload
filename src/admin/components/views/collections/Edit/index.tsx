import React, { useState, useEffect, useCallback } from 'react';
import { Redirect, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../utilities/Config';
import { useAuth } from '../../../utilities/Auth';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';

import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import DefaultEdit from './Default';
import formatFields from './formatFields';
import buildStateFromSchema from '../../../forms/Form/buildStateFromSchema';
import { useLocale } from '../../../utilities/Locale';
import { IndexProps } from './types';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { Fields } from '../../../forms/Form/types';
import { usePreferences } from '../../../utilities/Preferences';
import { EditDepthContext } from '../../../utilities/EditDepth';
import { CollectionPermission } from '../../../../../auth';

const EditView: React.FC<IndexProps> = (props) => {
  const { collection: incomingCollection, isEditing } = props;

  const {
    slug,
    admin: {
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
  const [internalState, setInternalState] = useState<Fields>();
  const [updatedAt, setUpdatedAt] = useState<string>();
  const { user } = useAuth();
  const { getVersions, preferencesKey, getDocPermissions, docPermissions } = useDocumentInfo();
  const { getPreference } = usePreferences();
  const { t } = useTranslation('general');

  const [{ data, isLoading: isLoadingData, isError }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0, draft: 'true' } },
  );

  const onSave = useCallback(async (json: {
    doc
  }) => {
    getVersions();
    getDocPermissions();
    setUpdatedAt(json?.doc?.updatedAt);
    if (!isEditing) {
      setRedirect(`${admin}/collections/${collection.slug}/${json?.doc?.id}`);
    } else {
      const state = await buildStateFromSchema({ fieldSchema: collection.fields, data: json.doc, user, id, operation: 'update', locale, t });
      setInternalState(state);
    }
  }, [admin, collection, isEditing, getVersions, user, id, t, locale, getDocPermissions]);

  const dataToRender = (locationState as Record<string, unknown>)?.data || data;

  useEffect(() => {
    const awaitInternalState = async () => {
      setUpdatedAt(dataToRender?.updatedAt);
      const state = await buildStateFromSchema({ fieldSchema: fields, data: dataToRender, user, operation: isEditing ? 'update' : 'create', id, locale, t });
      await getPreference(preferencesKey);
      setInternalState(state);
    };

    awaitInternalState();
  }, [dataToRender, fields, isEditing, id, user, locale, isLoadingData, preferencesKey, getPreference, t]);

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

  const apiURL = `${serverURL}${api}/${slug}/${id}${collection.versions.drafts ? '?draft=true' : ''}`;
  const action = `${serverURL}${api}/${slug}${isEditing ? `/${id}` : ''}?locale=${locale}&depth=0&fallback-locale=null`;
  const hasSavePermission = (isEditing && docPermissions?.update?.permission) || (!isEditing && (docPermissions as CollectionPermission)?.create?.permission);
  const isLoading = !internalState || !docPermissions || isLoadingData;

  return (
    <EditDepthContext.Provider value={1}>
      <RenderCustomComponent
        DefaultComponent={DefaultEdit}
        CustomComponent={CustomEdit}
        componentProps={{
          id,
          isLoading,
          data: dataToRender,
          collection,
          permissions: docPermissions,
          isEditing,
          onSave,
          internalState,
          hasSavePermission,
          apiURL,
          action,
          updatedAt: updatedAt || dataToRender?.updatedAt,
        }}
      />
    </EditDepthContext.Provider>
  );
};
export default EditView;
