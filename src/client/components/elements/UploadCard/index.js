import React from 'react';
import PropTypes from 'prop-types';
import Thumbnail from '../Thumbnail';

import './index.scss';

const baseClass = 'upload-card';

const UploadCard = (props) => {
  const {
    onClick,
    mimeType,
    sizes,
    filename,
    collection: {
      upload: {
        adminThumbnail,
        staticURL,
      } = {},
    } = {},
  } = props;

  const classes = [
    baseClass,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={typeof onClick === 'function' ? onClick : undefined}
    >
      <Thumbnail
        size="expand"
        {...{
          mimeType, adminThumbnail, sizes, staticURL, filename,
        }}
      />
      <div className={`${baseClass}__filename`}>
        {filename}
      </div>
    </div>
  );
};

UploadCard.defaultProps = {
  sizes: undefined,
  onClick: undefined,
};

UploadCard.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
    upload: PropTypes.shape({
      adminThumbnail: PropTypes.string,
      staticURL: PropTypes.string,
    }),
  }).isRequired,
  id: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
  mimeType: PropTypes.string.isRequired,
  sizes: PropTypes.shape({}),
  onClick: PropTypes.func,
};


export default UploadCard;
