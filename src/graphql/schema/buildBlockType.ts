/* eslint-disable no-param-reassign */
import { Payload } from '../..';
import { Block } from '../../fields/config/types';
import formatName from '../utilities/formatName';
import buildObjectType from './buildObjectType';

type Args = {
  payload: Payload
  block: Block
  forceNullable?: boolean
}

function buildBlockType({
  payload,
  block,
  forceNullable,
}: Args): void {
  const {
    slug,
    labels: {
      singular,
    },
  } = block;

  if (!payload.types.blockTypes[slug]) {
    const formattedBlockName = formatName(singular);
    payload.types.blockTypes[slug] = buildObjectType({
      payload,
      name: formattedBlockName,
      parentName: formattedBlockName,
      fields: [
        ...block.fields,
        {
          name: 'blockType',
          type: 'text',
        },
      ],
      forceNullable,
    });
  }
}

export default buildBlockType;
