import React from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch } from 'react-router-dom';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';

import './index.scss';

const {
  serverURL,
  routes: {
    admin
  }
} = getSanitizedConfig();

const EditView = (props) => {
  const { collection, isEditing } = props;
  const match = useRouteMatch();
  const [data] = usePayloadAPI(
    `${serverURL}/${collection.slug}/${isEditing ? match.params.id : ''}`
  );

  const nav = [{
    url: `${admin}/collections/${collection.slug}`,
    label: collection.labels.plural,
  }];

  if (isEditing) {
    nav.push({
      url: `${admin}/collections/${collection.slug}/${data._id}`,
      label: data ? data[collection.useAsTitle] : ''
    })
  } else {
    nav.push({
      label: 'Create New'
    })
  }

  return (
    <DefaultTemplate
      className="collection-edit"
      stepNav={nav}
    >
      <header>
        {isEditing &&
          <h1>
            Edit {Object.keys(data).length > 0 &&
              (data[collection.useAsTitle] ? data[collection.useAsTitle] : '[Untitled]')
            }
          </h1>
        }
        {!isEditing &&
          <h1>Create New {collection.labels.singular}</h1>
        }
      </header>
    </DefaultTemplate>
  );
};

EditView.defaultProps = {
  isEditing: false,
};

EditView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
  }).isRequired,
  isEditing: PropTypes.bool,
};

export default EditView;
