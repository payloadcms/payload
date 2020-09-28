import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'upload-cell';

const UploadCell = ({ data }) => (
  <React.Fragment>
    <span>
      {data.filename}
    </span>
    <span className={`${baseClass}--mime-type`}>
      {data.mimeType}
    </span>
  </React.Fragment>
);

UploadCell.defaultProps = {
  data: {},
};

UploadCell.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.shape({
      filename: PropTypes.string,
      mimeType: PropTypes.string,
    }),
    PropTypes.string,
  ]),
};

export default UploadCell;
