import type { Block } from 'payload'

export const testBlock1: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-1',
}

export const testBlock2: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-2',
}

export const testBlock3: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-3',
}

export const testBlock4: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-4',
}

export const testBlock5: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-5',
}

export const testBlock6: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-6',
}

export const testBlock7: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-7',
}

export const testBlock8: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-8',
}

export const testBlock9: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-9',
}

export const testBlock10: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
  ],
  slug: 'test-block-10',
}

export const hotspotsBlock1: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots1',
}

export const hotspotsBlock2: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots2',
}

export const hotspotsBlock3: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots3',
}

export const hotspotsBlock4: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots4',
}

export const hotspotsBlock5: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots5',
}

export const hotspotsBlock6: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots6',
}

export const hotspotsBlock7: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots7',
}

export const hotspotsBlock8: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots8',
}

export const hotspotsBlock9: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots9',
}

export const hotspotsBlock10: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots10',
}

export const hotspotsBlock11: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'hotspots',
      fields: [
        {
          name: 'hotspot',
          fields: [
            {
              name: 'nr',
              required: true,
              type: 'text',
            },
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'coordinates',
              fields: [
                {
                  name: 'x',
                  admin: {
                    description: 'The X coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
                {
                  name: 'y',
                  admin: {
                    description: 'The Y coordinate of the hotspot in %',
                  },
                  max: 100,
                  min: 0,
                  required: true,
                  type: 'number',
                },
              ],
              type: 'group',
            },
          ],
          interfaceName: 'Hotspot',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'hotspots11',
}

const blocksBlock1: Block = {
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'blocks',
      fields: [
        {
          name: 'block',
          fields: [
            {
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              name: 'text',
              required: true,
              type: 'textarea',
            },
            {
              name: 'blocks',
              type: 'blocks',
              blocks: [
                testBlock1,
                testBlock2,
                testBlock3,
                testBlock4,
                testBlock5,
                testBlock6,
                testBlock7,
                testBlock8,
                testBlock9,
                testBlock10,
                hotspotsBlock1,
                hotspotsBlock2,
                hotspotsBlock3,
                hotspotsBlock4,
                hotspotsBlock5,
                hotspotsBlock6,
              ],
            },
          ],
          interfaceName: 'Block',
          type: 'group',
        },
      ],
      type: 'array',
    },
  ],
  slug: 'blocks1',
}

export const testBlocks = [
  testBlock1,
  testBlock2,
  testBlock3,
  testBlock4,
  testBlock5,
  testBlock6,
  testBlock7,
  testBlock8,
  testBlock9,
  testBlock10,
  hotspotsBlock1,
  hotspotsBlock2,
  hotspotsBlock3,
  hotspotsBlock4,
  hotspotsBlock5,
  hotspotsBlock6,
  hotspotsBlock7,
  hotspotsBlock8,
  hotspotsBlock9,
  hotspotsBlock10,
  hotspotsBlock11,
  blocksBlock1,
]
