import React from 'react';
import PropTypes from 'prop-types';

const BlocksCell = ({ data, field }) => {
  const selectedBlocks = data ? data.map(({ blockType }) => blockType) : [];
  const blockLabels = field.blocks.map((s) => ({ slug: s.slug, label: s.labels.singular }));

  let label = `0 ${field.label}`;

  const formatBlockList = (blocks) => blocks.map((b) => {
    const filtered = blockLabels.filter((f) => f.slug === b)?.[0];
    return filtered?.label;
  }).join(', ');

  const itemsToShow = 5;
  if (selectedBlocks.length > itemsToShow) {
    const more = selectedBlocks.length - itemsToShow;
    label = `${selectedBlocks.length} ${field.label} - ${formatBlockList(selectedBlocks.slice(0, itemsToShow))} and ${more} more`;
  } else if (selectedBlocks.length > 0) {
    label = `${selectedBlocks.length} ${field.label} - ${formatBlockList(selectedBlocks)}`;
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
    blocks: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
  }).isRequired,
};

export default BlocksCell;
