import React from 'react';
import PropTypes from 'prop-types';

import FallbackBlockImage from '../../../../../graphics/FallbackBlockImage';

import './index.scss';

const baseClass = 'block-selection';

const BlockSelection = (props) => {
  const { addRow, addRowIndex, block } = props;

  const { labels, slug, blockImage } = block;

  return (
    <div
      className={baseClass}
      role="button"
      tabIndex={0}
      onClick={() => addRow(addRowIndex, slug)}
    >
      <div className={`${baseClass}__image`}>
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
};

export default BlockSelection;
