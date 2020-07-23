import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import config from 'payload/config';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import { useUser } from '../../../data/User';
import formatFields from './formatFields';
import Loading from '../../../elements/Loading';
import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import DefaultEdit from './Default';

const { serverURL, routes: { admin, api } } = config;

const EditView = (props) => {
  const { params: { id } = {} } = useRouteMatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [fields, setFields] = useState([]);
  const [componentProps, setComponentProps] = useState(null);
  const { permissions } = useUser();

  const { collection, isEditing } = props;

  const {
    slug,
    labels: {
      plural: pluralLabel,
    },
    admin: {
      useAsTitle,
    },
  } = collection;

  const onSave = useCallback((json) => {
    history.push(`${admin}/collections/${collection.slug}/${json?.doc?.id}`, {
      status: {
        message: json.message,
        type: 'success',
      },
      data: json.doc,
    });
  }, [collection, history]);

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
    setFields(formatFields(collection, isEditing));
  }, [collection, isEditing]);

  const collectionPermissions = permissions?.[slug];

  useEffect(() => {
    setComponentProps({
      data: dataToRender,
      collection: { ...collection, fields },
      permissions: collectionPermissions,
      isEditing,
      onSave,
    });
  }, [dataToRender, collection, fields, collectionPermissions, isEditing, onSave]);

  if (isLoading) {
    return <Loading />;
  }

  if (componentProps) {
    return (
      <RenderCustomComponent
        DefaultComponent={DefaultEdit}
        path={`${slug}.views.Edit`}
        componentProps={componentProps}
      />
    );
  }

  return null;
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
  }).isRequired,
  isEditing: PropTypes.bool,
};

export default EditView;
