import React from 'react';

import DefaultBlockImage from '../../../../../graphics/DefaultBlockImage';
import { Props } from './types';

import './index.scss';

const baseClass = 'block-selection';

const BlockSelection: React.FC<Props> = (props) => {
  const {
    addRow, addRowIndex, block, close,
  } = props;

  const {
    labels, slug, blockImage, blockImageAltText,
  } = block;

  const handleBlockSelection = () => {
    close();
    addRow(addRowIndex, slug);
  };

  return (
    <button
      className={baseClass}
      tabIndex={0}
      type="button"
      onClick={handleBlockSelection}
    >
      <div className={`${baseClass}__image`}>
        {blockImage
          ? (
            <img
              src={blockImage}
              alt={blockImageAltText}
            />
          )
          : <DefaultBlockImage />}
      </div>
      <div className={`${baseClass}__label`}>{labels.singular}</div>
    </button>
  );
};

export default BlockSelection;
