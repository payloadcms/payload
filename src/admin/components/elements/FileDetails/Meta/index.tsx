import React from 'react';
import { useConfig } from '../../../utilities/Config';
import CopyToClipboard from '../../CopyToClipboard';
import formatFilesize from '../../../../../uploads/formatFilesize';
import { Props } from './types';

import './index.scss';

const baseClass = 'file-meta';

const Meta: React.FC<Props> = (props) => {
  const {
    filename, filesize, width, height, mimeType, staticURL, url,
  } = props;

  const { serverURL } = useConfig();

  const fileURL = url || `${serverURL}${staticURL}/${filename}`;

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

export default Meta;
