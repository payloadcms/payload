import React from 'react';
import PropTypes from 'prop-types';

import BlockSelection from '../BlockSelection';

import './index.scss';

const baseClass = 'blocks-container';

const BlocksContainer = (props) => {
  const { blocks, ...remainingProps } = props;

  return (
    <div className={baseClass}>
      {blocks?.map((block, index) => {
        return (
          <BlockSelection
            key={index}
            block={block}
            {...remainingProps}
          />
        );
      })}
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
