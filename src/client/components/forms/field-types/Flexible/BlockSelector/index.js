import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import BlockSearch from './BlockSearch';
import BlocksContainer from './BlocksContainer';

const baseClass = 'block-selector';

const BlockSelector = (props) => {
  const { blocks, ...remainingProps } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlocks, setFilteredBlocks] = useState(blocks);

  useEffect(() => {
    const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
      if (block.slug.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) matchedBlocks.push(block);
      return matchedBlocks;
    }, []);

    setFilteredBlocks(matchingBlocks);
  }, [searchTerm, blocks]);

  return (
    <div className={baseClass}>
      <BlockSearch setSearchTerm={setSearchTerm} />
      <BlocksContainer
        blocks={filteredBlocks}
        {...remainingProps}
      />
    </div>
  );
};

BlockSelector.defaultProps = {};

BlockSelector.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default BlockSelector;
