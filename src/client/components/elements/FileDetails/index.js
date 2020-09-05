import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import Thumbnail from '../Thumbnail';
import Button from '../Button';
import Meta from './Meta';

import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'file-details';

const FileDetails = (props) => {
  const {
    filename, mimeType, filesize, staticURL, adminThumbnail, sizes, handleRemove, width, height,
  } = props;

  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  const hasSizes = Object.keys(sizes)?.length > 0;

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail {...{
          mimeType, adminThumbnail, sizes, staticURL, filename,
        }}
        />
        <div className={`${baseClass}__main-detail`}>
          <Meta
            staticURL={staticURL}
            filename={filename}
            filesize={filesize}
            width={width}
            height={height}
            mimeType={mimeType}
          />
          {hasSizes && (
            <Button
              className={`${baseClass}__toggle-more-info${moreInfoOpen ? ' open' : ''}`}
              buttonStyle="none"
              onClick={() => setMoreInfoOpen(!moreInfoOpen)}
            >
              {!moreInfoOpen && (
                <React.Fragment>
                  More info
                  <Chevron />
                </React.Fragment>
              )}
              {moreInfoOpen && (
                <React.Fragment>
                  Less info
                  <Chevron />
                </React.Fragment>
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
      {hasSizes && (
        <AnimateHeight
          className={`${baseClass}__more-info`}
          height={moreInfoOpen ? 'auto' : 0}
        >
          <ul className={`${baseClass}__sizes`}>
            {Object.entries(sizes).map(([key, val]) => (
              <li key={key}>
                <div className={`${baseClass}__size-label`}>
                  {key}
                </div>
                <Meta
                  {...val}
                  mimeType={mimeType}
                  staticURL={staticURL}
                />
              </li>
            ))}
          </ul>
        </AnimateHeight>
      )}

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
