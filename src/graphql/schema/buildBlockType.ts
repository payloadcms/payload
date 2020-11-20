import formatName from '../utilities/formatName';

function buildBlockType(block) {
  const {
    slug,
    labels: {
      singular,
    },
  } = block;

  if (!this.types.blockTypes[slug]) {
    const formattedBlockName = formatName(singular);
    this.types.blockTypes[slug] = this.buildObjectType(
      formattedBlockName,
      [
        ...block.fields,
        {
          name: 'blockName',
          type: 'text',
        },
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
