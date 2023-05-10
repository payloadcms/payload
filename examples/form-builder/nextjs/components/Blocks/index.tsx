import React, { Fragment } from 'react';
import { Page } from '../../payload-types';
import { toKebabCase } from '../../utilities/toKebabCase';
import { VerticalPadding } from '../VerticalPadding';
import { FormBlock } from './Form'

const blockComponents = {
  formBlock: FormBlock,
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
            form
          } = block;

          const isFormBlock = blockType === 'formBlock'
          {/*@ts-ignore*/ }
          const formID: string = isFormBlock && form && form.id

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType];

            return (
              <VerticalPadding
                key={isFormBlock ? formID : index}
                top='small'
                bottom='small'
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
