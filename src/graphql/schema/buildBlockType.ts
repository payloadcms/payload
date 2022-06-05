/* eslint-disable no-param-reassign */
import { Payload } from '../..';
import { Block } from '../../fields/config/types';
import formatName from '../utilities/formatName';
import buildObjectType from './buildObjectType';

function buildBlockType(payload: Payload, block: Block): void {
  const {
    slug,
    labels: {
      singular,
    },
  } = block;

  if (!payload.types.blockTypes[slug]) {
    const formattedBlockName = formatName(singular);
    payload.types.blockTypes[slug] = buildObjectType(
      payload,
      formattedBlockName,
      [
        ...block.fields,
        {
          name: 'blockType',
          type: 'text',
        },
      ],
      formattedBlockName,
    );
  }
}

export default buildBlockType;
