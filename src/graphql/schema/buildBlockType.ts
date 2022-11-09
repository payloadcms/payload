/* eslint-disable no-param-reassign */
import { Payload } from '../..';
import { Block } from '../../fields/config/types';
import buildObjectType from './buildObjectType';
import { toWords } from '../../utilities/formatLabels';

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
  } = block;

  if (!payload.types.blockTypes[slug]) {
    const formattedBlockName = toWords(slug);
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
