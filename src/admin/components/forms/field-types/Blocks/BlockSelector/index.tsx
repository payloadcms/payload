import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import BlockSearch from './BlockSearch';
import BlocksContainer from './BlocksContainer';
import { Props } from './types';

const baseClass = 'block-selector';

const BlockSelector: React.FC<Props> = (props) => {
  const {
    blocks, close, parentIsHovered, watchParentHover, ...remainingProps
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlocks, setFilteredBlocks] = useState(blocks);
  const [isBlockSelectorHovered, setBlockSelectorHovered] = useState(false);

  useEffect(() => {
    const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
      if (block.slug.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) matchedBlocks.push(block);
      return matchedBlocks;
    }, []);

    setFilteredBlocks(matchingBlocks);
  }, [searchTerm, blocks]);

  useEffect(() => {
    if (!parentIsHovered && !isBlockSelectorHovered && close && watchParentHover) close();
  }, [isBlockSelectorHovered, parentIsHovered, close, watchParentHover]);

  return (
    <div
      className={baseClass}
      onMouseEnter={() => setBlockSelectorHovered(true)}
      onMouseLeave={() => setBlockSelectorHovered(false)}
    >
      <BlockSearch setSearchTerm={setSearchTerm} />
      <BlocksContainer
        blocks={filteredBlocks}
        close={close}
        {...remainingProps}
      />
    </div>
  );
};

BlockSelector.defaultProps = {
  close: null,
  parentIsHovered: false,
  watchParentHover: false,
};

BlockSelector.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  close: PropTypes.func,
  watchParentHover: PropTypes.bool,
  parentIsHovered: PropTypes.bool,
};

export default BlockSelector;
