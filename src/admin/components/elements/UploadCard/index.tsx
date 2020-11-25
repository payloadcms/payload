import React from 'react';
import { Props } from './types';
import Thumbnail from '../Thumbnail';

import './index.scss';

const baseClass = 'upload-card';

const UploadCard: React.FC<Props> = (props) => {
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

export default UploadCard;
