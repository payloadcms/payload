import React from 'react';
import { Props } from './types';

import BlockSelection from '../BlockSelection';

import './index.scss';

const baseClass = 'blocks-container';

const BlocksContainer: React.FC<Props> = (props) => {
  const { blocks, ...remainingProps } = props;

  return (
    <div className={baseClass}>
      {blocks?.map((block, index) => (
        <BlockSelection
          key={index}
          block={block}
          {...remainingProps}
        />
      ))}
    </div>
  );
};

export default BlocksContainer;
