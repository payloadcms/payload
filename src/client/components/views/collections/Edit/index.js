import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import config from 'payload/config';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import { useUser } from '../../../data/User';

import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import DefaultEdit from './Default';
import buildStateFromSchema from '../../../forms/Form/buildStateFromSchema';

const { serverURL, routes: { admin, api } } = config;

const EditView = (props) => {
  const { collection, isEditing } = props;

  const {
    slug,
    labels: {
      plural: pluralLabel,
    },
    admin: {
      useAsTitle,
    },
    fields,
    auth,
  } = collection;

  const { params: { id } = {} } = useRouteMatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [initialState, setInitialState] = useState({});
  const { permissions } = useUser();

  const onSave = (json) => {
    history.push(`${admin}/collections/${collection.slug}/${json?.doc?.id}`, {
      status: {
        message: json.message,
        type: 'success',
      },
      data: json.doc,
    });
  };

  const [{ data, isLoading }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null', depth: 0 } },
  );

  const dataToRender = locationState?.data || data;

  useEffect(() => {
    const nav = [{
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
  }, [setStepNav, isEditing, pluralLabel, dataToRender, slug, useAsTitle]);

  useEffect(() => {
    const awaitInitialState = async () => {
      const state = await buildStateFromSchema(fields, dataToRender);
      setInitialState(state);
    };

    awaitInitialState();
  }, [dataToRender, fields]);

  const collectionPermissions = permissions?.[slug];

  const apiURL = `${serverURL}${api}/${slug}/${id}`;
  let action = `${serverURL}${api}/${slug}${isEditing ? `/${id}` : ''}?depth=0`;
  const hasSavePermission = (isEditing && collectionPermissions?.update?.permission) || (!isEditing && collectionPermissions?.create?.permission);

  if (auth && !isEditing) {
    action = `${action}/register`;
  }

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultEdit}
      path={`${slug}.views.Edit`}
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
      }}
    />
  );
};

EditView.defaultProps = {
  isEditing: false,
};

EditView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    admin: PropTypes.shape({
      useAsTitle: PropTypes.string,
    }),
    fields: PropTypes.arrayOf(PropTypes.shape({})),
    preview: PropTypes.func,
    auth: PropTypes.shape({}),
  }).isRequired,
  isEditing: PropTypes.bool,
};

export default EditView;
