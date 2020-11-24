import React from 'react';
import PropTypes from 'prop-types';
import { useConfig } from '@payloadcms/config-provider';
import CopyToClipboard from '../../CopyToClipboard';
import formatFilesize from '../../../../../uploads/formatFilesize';

import './index.scss';

const baseClass = 'file-meta';

const Meta = (props) => {
  const {
    filename, filesize, width, height, mimeType, staticURL,
  } = props;

  const { serverURL } = useConfig();

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
          <React.Fragment>
            &nbsp;-&nbsp;
            {width}
            x
            {height}
          </React.Fragment>
        )}
        {mimeType && (
          <React.Fragment>
            &nbsp;-&nbsp;
            {mimeType}
          </React.Fragment>
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
