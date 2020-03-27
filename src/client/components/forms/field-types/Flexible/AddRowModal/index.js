import React from 'react';
import PropTypes from 'prop-types';
import { asModal } from '@trbl/react-modal';

const baseClass = 'flexible-add-row-modal';

const AddRowModal = (props) => {
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

AddRowModal.defaultProps = {
  rowIndexBeingAdded: null,
};

AddRowModal.propTypes = {
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

export default asModal(AddRowModal);
