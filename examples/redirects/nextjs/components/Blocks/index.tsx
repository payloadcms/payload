import React, { Fragment } from 'react';
import { Page } from '../../payload-types';
import { toKebabCase } from '../../utilities/toKebabCase';
import { VerticalPadding } from '../VerticalPadding';
import { ContentBlock } from './Content';

const blockComponents = {
  content: ContentBlock,
}

const Blocks: React.FC<{
  blocks: Page['layout']
}> = (props) => {
  const {
    blocks,
  } = props;

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const {
            blockName,
            blockType,

          } = block;

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType];

            return (
              <VerticalPadding
                key={index}
              >
                {/*@ts-ignore*/}
                <Block
                  id={toKebabCase(blockName)}
                  {...block}
                />
              </VerticalPadding>
            );

          }
          return null;
        })}
      </Fragment>
    );
  }

  return null;
};

export default Blocks;
