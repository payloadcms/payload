import React from 'react';
import PropTypes from 'prop-types';

import SelectableBlock from '../SelectableBlock';

import './index.scss';

const baseClass = 'blocks-container';

const BlocksContainer = (props) => {
  const { blocks, ...remainingProps } = props;

  return (
    <div className={baseClass}>
      {blocks?.map((block, index) => {
        return (
          <SelectableBlock
            key={index}
            block={block}
            {...remainingProps}
          />
        );
      })}
      Blocks to choose from...
    </div>
  );
};

BlocksContainer.defaultProps = {
  blocks: [],
};

BlocksContainer.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.shape({})),
};

export default BlocksContainer;
