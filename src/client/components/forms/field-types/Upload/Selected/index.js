import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'selected-upload';

const SelectedUpload = () => {
  const { id, collection } = props;

  return (
    <div className={baseClass}>
      {id}
    </div>
  );
};

SelectedUpload.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
  }).isRequired,
  id: PropTypes.string.isRequired,
};


export default SelectedUpload;
