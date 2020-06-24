import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import FileGraphic from '../../graphics/File';
import config from '../../../config';
import getThumbnail from '../../../../uploads/getThumbnail';
import Button from '../Button';
import formatFilesize from '../../../../uploads/formatFilesize';
import CopyToClipboard from '../CopyToClipboard';
import Chevron from '../../icons/Chevron';

import './index.scss';

const { serverURL } = config;

const baseClass = 'file-details';

const FileDetails = (props) => {
  const {
    filename, mimeType, filesize, staticURL, adminThumbnail, sizes, handleRemove, width, height,
  } = props;

  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  const thumbnail = getThumbnail(mimeType, staticURL, filename, sizes, adminThumbnail);

  const imageURL = `${serverURL}${staticURL}/${filename}`;

  return (
    <div className={baseClass}>
      <header>
        <div className={`${baseClass}__thumbnail`}>
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
        <div className={`${baseClass}__main-detail`}>
          <div className={`${baseClass}__url`}>
            <a
              href={imageURL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {filename}
            </a>
            <CopyToClipboard
              value={imageURL}
              defaultMessage="Copy URL"
            />
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
          {sizes && (
            <Button
              className={`${baseClass}__toggle-more-info${moreInfoOpen ? ' open' : ''}`}
              buttonStyle="none"
              onClick={() => setMoreInfoOpen(!moreInfoOpen)}
            >
              {!moreInfoOpen && (
                <>
                  More info
                  <Chevron />
                </>
              )}
              {moreInfoOpen && (
                <>
                  Less info
                  <Chevron />
                </>
              )}
            </Button>
          )}
        </div>
        {handleRemove && (
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            iconStyle="with-border"
            onClick={handleRemove}
            className={`${baseClass}__remove`}
          />
        )}
      </header>
      <AnimateHeight
        className={`${baseClass}__more-info`}
        height={moreInfoOpen ? 'auto' : 0}
      >
        test
      </AnimateHeight>
    </div>
  );
};

FileDetails.defaultProps = {
  adminThumbnail: undefined,
  handleRemove: undefined,
  width: undefined,
  height: undefined,
  sizes: undefined,
};

FileDetails.propTypes = {
  filename: PropTypes.string.isRequired,
  mimeType: PropTypes.string.isRequired,
  filesize: PropTypes.number.isRequired,
  staticURL: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  sizes: PropTypes.shape({}),
  adminThumbnail: PropTypes.string,
  handleRemove: PropTypes.func,
};

export default FileDetails;
