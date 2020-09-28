import React from 'react';
import PropTypes from 'prop-types';

const BlocksCell = ({ data, field }) => {
  const selectedBlocks = data ? data.map(({ blockType }) => blockType) : [];

  let label = `0 ${field.label}.`;

  const formatBlocks = (blocks) => blocks.map((b) => b.charAt(0).toUpperCase() + b.slice(1)).join(', ');

  const itemsToShow = 5;
  if (selectedBlocks.length > itemsToShow) {
    const more = selectedBlocks.length - itemsToShow;
    label = `${selectedBlocks.length} ${field.label} - ${formatBlocks(selectedBlocks.slice(0, itemsToShow))} and ${more} more`;
  } else if (selectedBlocks.length > 0) {
    label = `${selectedBlocks.length} ${field.label} - ${formatBlocks(selectedBlocks)}`;
  }

  return (
    <span>{label}</span>
  );
};

BlocksCell.defaultProps = {
  data: [],
};

BlocksCell.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  field: PropTypes.shape({
    singularLabel: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
};

export default BlocksCell;
