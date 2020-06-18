import React from 'react';
import PropTypes from 'prop-types';

const baseClass = 'selectable-block';

const SelectableBlock = (props) => {
  const { addRow, addRowIndex, block } = props;

  const { labels, slug } = block;

  return (
    <div
      className={baseClass}
      role="button"
      onClick={() => addRow(addRowIndex, slug)}
    >
      {labels.singular}
    </div>
  );
};

SelectableBlock.defaultProps = {
  addRow: undefined,
  addRowIndex: 0,
};

SelectableBlock.propTypes = {
  addRow: PropTypes.func,
  addRowIndex: PropTypes.number,
};

export default SelectableBlock;
