import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FileGraphic from '../../graphics/File';
import config from '../../../config';
import getThumbnail from '../../../../uploads/getThumbnail';
import Button from '../Button';
import formatFilesize from '../../../../uploads/formatFilesize';

import './index.scss';

const { serverURL } = config;

const baseClass = 'file-details';

const FileDetails = (props) => {
  const {
    filename, mimeType, filesize, staticURL, adminThumbnail, sizes, handleRemove, width, height,
  } = props;

  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  const thumbnail = getThumbnail(mimeType, staticURL, filename, sizes, adminThumbnail);

  return (
    <div className={baseClass}>
      <header>
        {!thumbnail && (
          <FileGraphic />
        )}
        {thumbnail && (
          <div className={`${baseClass}__thumbnail`}>
            <img
              src={`${serverURL}${thumbnail}`}
              alt={filename}
            />
          </div>
        )}
        <div className={`${baseClass}__main-detail`}>
          <div className={`${baseClass}__url`}>
            <a
              href={`${serverURL}${staticURL}/${filename}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {filename}
            </a>
          </div>
          <div className={`${baseClass}__meta`}>
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
        <Button
          icon="x"
          round
          buttonStyle="icon-label"
          iconStyle="with-border"
          onClick={handleRemove}
        />
      </header>
      <div className={`${baseClass}__more-info`}>
        test
      </div>
    </div>
  );
};

FileDetails.defaultProps = {
  adminThumbnail: undefined,
};

FileDetails.propTypes = {
  filename: PropTypes.string.isRequired,
  mimeType: PropTypes.string.isRequired,
  filesize: PropTypes.number.isRequired,
  staticURL: PropTypes.string.isRequired,
  adminThumbnail: PropTypes.string,
};

export default FileDetails;
