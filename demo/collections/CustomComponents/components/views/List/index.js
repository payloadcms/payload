import React from 'react';
import PropTypes from 'prop-types';
import MinimalTemplate from '../../../../../../src/client/components/templates/Minimal';

import './index.scss';

const CustomListView = (props) => {
  const { collection } = props;

  return (
    <MinimalTemplate className="custom-list">
      <h1>{collection.labels.plural}</h1>
      <p>This is a custom Pages list view</p>
      <p>Sup</p>
    </MinimalTemplate>
  );
};

CustomListView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
    }),
  }).isRequired,
};

export default CustomListView;
