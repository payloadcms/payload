import React from 'react';
import PropTypes from 'prop-types';
import UploadCard from '../UploadCard';

import './index.scss';

const baseClass = 'upload-gallery';

const UploadGallery = (props) => {
  const { docs, onCardClick, collection } = props;


  if (docs && docs.length > 0) {
    return (
      <ul className={baseClass}>
        {docs.map((doc, i) => {
          return (
            <li key={i}>
              <UploadCard
                {...doc}
                {...{ collection }}
                onClick={() => onCardClick(doc)}
              />
            </li>
          );
        })}
      </ul>
    );
  }

  return null;
};

UploadGallery.defaultProps = {
  docs: undefined,
};

UploadGallery.propTypes = {
  docs: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  collection: PropTypes.shape({}).isRequired,
  onCardClick: PropTypes.func.isRequired,
};

export default UploadGallery;
