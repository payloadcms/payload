import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import FileGraphic from '../../graphics/File';
import config from '../../../config';
import getThumbnail from '../../../../uploads/getThumbnail';
import Button from '../Button';
import Meta from './Meta';

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
          <Meta
            staticURL={staticURL}
            filename={filename}
            filesize={filesize}
            width={width}
            height={height}
            mimeType={mimeType}
          />
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
      {sizes && (
        <AnimateHeight
          className={`${baseClass}__more-info`}
          height={moreInfoOpen ? 'auto' : 0}
        >
          <ul className={`${baseClass}__sizes`}>
            {Object.entries(sizes).map(([key, val]) => {
              return (
                <li key={key}>
                  <div className={`${baseClass}__size-label`}>
                    {key}
                  </div>
                  <Meta
                    {...val}
                    staticURL={staticURL}
                  />
                </li>
              );
            })}
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
