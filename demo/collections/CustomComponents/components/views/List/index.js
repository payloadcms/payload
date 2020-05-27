import React from 'react';
import PropTypes from 'prop-types';
import DefaultList from '../../../../../../src/client/components/views/collections/List/Default';

import './index.scss';

const CustomListView = (props) => {
  return (
    <div className="custom-list">
      <p>This is a custom Pages list view</p>
      <p>Sup</p>
      <DefaultList {...props} />
    </div>
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
