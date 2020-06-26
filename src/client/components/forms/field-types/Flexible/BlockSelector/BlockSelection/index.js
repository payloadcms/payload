import React from 'react';
import PropTypes from 'prop-types';

import FallbackBlockImage from '../../../../../graphics/FallbackBlockImage';

import './index.scss';

const baseClass = 'block-selection';

const BlockSelection = (props) => {
  const {
    addRow, addRowIndex, block, close,
  } = props;

  const { labels, slug, blockImage } = block;

  console.log(blockImage);

  const handleBlockSelection = () => {
    close();
    addRow(addRowIndex, slug);
  };

  return (
    <div
      className={baseClass}
      role="button"
      tabIndex={0}
      onClick={handleBlockSelection}
    >
      <div className={`${baseClass}__image`}>
        {/* <img src={blockImage} /> */}
        <FallbackBlockImage />
      </div>
      <div className={`${baseClass}__label`}>{labels.singular}</div>
    </div>
  );
};

BlockSelection.defaultProps = {
  addRow: undefined,
  addRowIndex: 0,
};

BlockSelection.propTypes = {
  addRow: PropTypes.func,
  addRowIndex: PropTypes.number,
  block: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    blockImage: PropTypes.string,
  }).isRequired,
  close: PropTypes.func.isRequired,
};

export default BlockSelection;
