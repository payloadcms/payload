import React from 'react';
import PropTypes from 'prop-types';
import { asModal } from '@trbl/react-modal';

import './index.scss';

const baseClass = 'add-content-block-modal';

const AddContentBlockModal = (props) => {
  const {
    addRow,
    blocks,
    rowIndexBeingAdded,
    closeAllModals,
  } = props;

  const handleAddRow = (blockType) => {
    addRow(rowIndexBeingAdded, blockType);
    closeAllModals();
  };

  return (
    <div className={baseClass}>
      <h2>Add a layout block</h2>
      <ul>
        {blocks.map((block, i) => {
          return (
            <li key={i}>
              <button
                onClick={() => handleAddRow(block.slug)}
                type="button"
              >
                {block.labels.singular}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

AddContentBlockModal.defaultProps = {
  rowIndexBeingAdded: null,
};

AddContentBlockModal.propTypes = {
  addRow: PropTypes.func.isRequired,
  closeAllModals: PropTypes.func.isRequired,
  blocks: PropTypes.arrayOf(
    PropTypes.shape({
      labels: PropTypes.shape({
        singular: PropTypes.string,
      }),
      previewImage: PropTypes.string,
      slug: PropTypes.string,
    }),
  ).isRequired,
  rowIndexBeingAdded: PropTypes.number,
};

export default asModal(AddContentBlockModal);
