import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import config from 'payload/config';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import { useUser } from '../../../data/User';
import formatFields from './formatFields';

import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import DefaultEdit from './Default';

const { serverURL, routes: { admin, api } } = config;

const EditView = (props) => {
  const { params: { id } = {} } = useRouteMatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [fields, setFields] = useState([]);
  const { permissions } = useUser();

  const { collection, isEditing } = props;

  const {
    slug,
    labels: {
      plural: pluralLabel,
    },
    useAsTitle,
  } = collection;

  const onSave = (json) => {
    history.push(`${admin}/collections/${collection.slug}/${json?.doc?.id}`, {
      status: {
        message: json.message,
        type: 'success',
      },
      data: json.doc,
    });
  };

  const [{ data }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null' } },
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

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultEdit}
      path={`${slug}.views.Edit`}
      componentProps={{
        data: dataToRender,
        collection: { ...collection, fields },
        permissions: permissions?.[collection.slug],
        isEditing,
        onSave,
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
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({})),
    preview: PropTypes.func,
  }).isRequired,
  isEditing: PropTypes.bool,
};

export default EditView;
