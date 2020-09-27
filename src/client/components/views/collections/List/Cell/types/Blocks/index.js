import React from 'react';
import PropTypes from 'prop-types';

const BlocksCell = ({ data, field }) => {
  const selectedBlocks = data ? data.map(({ blockType }) => blockType) : [];

  let label = `0 ${field.label}.`;

  if (selectedBlocks.length > 0) {
    label = `${selectedBlocks.length} ${field.label}`;
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
