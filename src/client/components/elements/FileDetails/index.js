import React from 'react';
import PropTypes from 'prop-types';
import FileGraphic from '../../graphics/File';

import './index.scss';

const baseClass = 'file-details';

const FileDetails = (props) => {
  const { filename, mimeType, filesize } = props;

  return (
    <div className={baseClass}>
      <FileGraphic />
    </div>
  );
};

FileDetails.defaultProps = {
  sizes: null,
};

FileDetails.propTypes = {
  filename: PropTypes.string.isRequired,
  mimeType: PropTypes.string.isRequired,
  filesize: PropTypes.number.isRequired,
  sizes: PropTypes.shape({}),
};

export default FileDetails;
