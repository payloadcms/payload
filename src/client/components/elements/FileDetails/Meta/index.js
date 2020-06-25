import React from 'react';
import PropTypes from 'prop-types';
import config from '../../../../config';
import CopyToClipboard from '../../CopyToClipboard';
import formatFilesize from '../../../../../uploads/formatFilesize';

import './index.scss';

const { serverURL } = config;

const baseClass = 'file-meta';

const Meta = (props) => {
  const {
    filename, filesize, width, height, mimeType, staticURL,
  } = props;

  const fileURL = `${serverURL}${staticURL}/${filename}`;

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__url`}>
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {filename}
        </a>
        <CopyToClipboard
          value={fileURL}
          defaultMessage="Copy URL"
        />
      </div>
      <div className={`${baseClass}__size-type`}>
        {formatFilesize(filesize)}
        {(width && height) && (
          <>
            &nbsp;-&nbsp;
            {width}
            x
            {height}
          </>
        )}
        {mimeType && (
          <>
            &nbsp;-&nbsp;
            {mimeType}
          </>
        )}
      </div>
    </div>
  );
};

Meta.defaultProps = {
  width: undefined,
  height: undefined,
  sizes: undefined,
};

Meta.propTypes = {
  filename: PropTypes.string.isRequired,
  mimeType: PropTypes.string.isRequired,
  filesize: PropTypes.number.isRequired,
  staticURL: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  sizes: PropTypes.shape({}),
};

export default Meta;
