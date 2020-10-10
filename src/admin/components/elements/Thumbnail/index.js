import React from 'react';
import PropTypes from 'prop-types';
import { useConfig } from '../../providers/Config';
import FileGraphic from '../../graphics/File';
import getThumbnail from '../../../../uploads/getThumbnail';

import './index.scss';

const baseClass = 'thumbnail';

const Thumbnail = (props) => {
  const {
    filename, mimeType, staticURL, sizes, adminThumbnail, size,
  } = props;

  const { serverURL } = useConfig();

  const thumbnail = getThumbnail(mimeType, staticURL, filename, sizes, adminThumbnail);

  const classes = [
    baseClass,
    `${baseClass}--size-${size}`,
  ].join(' ');

  return (
    <div className={classes}>
      {thumbnail && (
        <img
          src={`${serverURL}${thumbnail}`}
          alt={filename}
        />
      )}
      {!thumbnail && (
        <FileGraphic />
      )}
    </div>
  );
};

Thumbnail.defaultProps = {
  adminThumbnail: undefined,
  sizes: undefined,
  mimeType: undefined,
  size: 'medium',
};

Thumbnail.propTypes = {
  filename: PropTypes.string.isRequired,
  sizes: PropTypes.shape({}),
  adminThumbnail: PropTypes.string,
  mimeType: PropTypes.string,
  staticURL: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'expand']),
};

export default Thumbnail;
