import type { Config } from '../../config/types.js'
import type { CollectionConfig } from '../../index.js'
import type {
  ArrayField,
  Block,
  BlockField,
  CheckboxField,
  Field,
  NumberField,
  TextField,
} from './types.js'

import { ReservedFieldName } from '../../errors/index.js'
import { sanitizeFields } from './sanitize.js'

describe('reservedFieldNames - fields -', () => {
  const collectionConfig: CollectionConfig = {
    slug: 'some-collection',
    fields: [],
  }

  const config = {} as Config
  it('should throw on array with id field', async () => {
    const fields: Field[] = [
      {
        name: 'Some Collection',
        type: 'array',
        fields: [
          {
            name: 'id',
            type: 'text',
          },
        ],
        label: 'some-collection',
      },
    ]
    await expect(async () => {
      await sanitizeFields({
        collectionConfig,
        config,
        fields,
        validRelationships: [],
      })
    }).rejects.toThrow(ReservedFieldName)
  })

  describe('blocks -', () => {
    it('should throw on id', async () => {
      const fields: Field[] = [
        {
          name: 'Some Collection',
          type: 'blocks',
          blocks: [
            {
              slug: 'some-block',
              fields: [
                {
                  name: 'id',
                  type: 'text',
                },
              ],
            },
          ],
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeFields({
          collectionConfig,
          config,
          fields,
          validRelationships: [],
        })
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should throw on blockName', async () => {
      const fields: Field[] = [
        {
          name: 'Some Collection',
          type: 'blocks',
          blocks: [
            {
              slug: 'some-block',
              fields: [
                {
                  name: 'blockName',
                  type: 'text',
                },
              ],
            },
          ],
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeFields({
          collectionConfig,
          config,
          fields,
          validRelationships: [],
        })
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should throw on blockType', async () => {
      const fields: Field[] = [
        {
          name: 'Some Collection',
          type: 'blocks',
          blocks: [
            {
              slug: 'some-block',
              fields: [
                {
                  name: 'blockType',
                  type: 'text',
                },
              ],
            },
          ],
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        await sanitizeFields({
          collectionConfig,
          config,
          fields,
          validRelationships: [],
        })
      }).rejects.toThrow(ReservedFieldName)
    })
  })
})
