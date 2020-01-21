import React from 'react';
import PropTypes from 'prop-types';
import withEditData from '../../../data/edit';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';

import './index.scss';

const { routes: { admin } } = getSanitizedConfig();

const EditView = (props) => {
  const { collection, data, isEditing } = props;

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

EditView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
  }).isRequired,
  data: PropTypes.shape({
    _id: PropTypes.string,
  }).isRequired,
};

export default withEditData(EditView);
