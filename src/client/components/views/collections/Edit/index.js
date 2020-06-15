import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory } from 'react-router-dom';
import config from 'payload/config';
import { useStepNav } from '../../../elements/StepNav';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import formatFields from './formatFields';

import RenderCustomComponent from '../../../utilities/RenderCustomComponent';
import DefaultEdit from './Default';

const { serverURL, routes: { admin, api } } = config;

const EditView = (props) => {
  const { params: { id } = {} } = useRouteMatch();
  const history = useHistory();
  const { setStepNav } = useStepNav();
  const [fields, setFields] = useState([]);

  const { collection, isEditing } = props;

  const {
    slug,
    labels: {
      plural: pluralLabel,
    },
    useAsTitle,
  } = collection;

  const onSave = !isEditing ? (json) => {
    history.push(`${admin}/collections/${collection.slug}/${json.doc.id}`, {
      status: {
        message: json.message,
        type: 'success',
      },
    });
  } : null;

  const [{ data }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null' } },
  );

  useEffect(() => {
    const nav = [{
      url: `${admin}/collections/${slug}`,
      label: pluralLabel,
    }];

    if (isEditing) {
      nav.push({
        label: data ? data[useAsTitle || 'id'] : '',
      });
    } else {
      nav.push({
        label: 'Create New',
      });
    }

    setStepNav(nav);
  }, [setStepNav, isEditing, pluralLabel, data, slug, useAsTitle]);

  useEffect(() => {
    setFields(formatFields(collection));
  }, [collection]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultEdit}
      path={`${slug}.views.Edit`}
      componentProps={{
        data,
        collection: { ...collection, fields },
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
