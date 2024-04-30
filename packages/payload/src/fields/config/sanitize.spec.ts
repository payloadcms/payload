import { Config } from '../../config/types.js'
import { InvalidFieldName, InvalidFieldRelationship, MissingFieldType } from '../../errors/index.js'
import { sanitizeFields } from './sanitize.js'
import type {
  ArrayField,
  Block,
  BlockField,
  CheckboxField,
  Field,
  NumberField,
  TextField,
} from './types.js'

describe('sanitizeFields', () => {
  const config = {} as Config
  it('should throw on missing type field', async () => {
    const fields: Field[] = [
      // @ts-expect-error
      {
        label: 'some-collection',
        name: 'Some Collection',
      },
    ]
    await expect(async () => {
      await sanitizeFields({
        config,
        fields,
        validRelationships: [],
      })
    }).rejects.toThrow(MissingFieldType)
  })
  it('should throw on invalid field name', async () => {
    const fields: Field[] = [
      {
        label: 'some.collection',
        name: 'some.collection',
        type: 'text',
      },
    ]
    await expect(async () => {
      await sanitizeFields({
        config,
        fields,
        validRelationships: [],
      })
    }).rejects.toThrow(InvalidFieldName)
  })

  describe('auto-labeling', () => {
    it('should populate label if missing', async () => {
      const fields: Field[] = [
        {
          name: 'someField',
          type: 'text',
        },
      ]
      const sanitizedField = (
        await sanitizeFields({
          config,
          fields,
          validRelationships: [],
        })
      )[0] as TextField
      expect(sanitizedField.name).toStrictEqual('someField')
      expect(sanitizedField.label).toStrictEqual('Some Field')
      expect(sanitizedField.type).toStrictEqual('text')
    })
    it('should allow auto-label override', async () => {
      const fields: Field[] = [
        {
          label: 'Do not label',
          name: 'someField',
          type: 'text',
        },
      ]
      const sanitizedField = (
        await sanitizeFields({
          config,
          fields,
          validRelationships: [],
        })
      )[0] as TextField
      expect(sanitizedField.name).toStrictEqual('someField')
      expect(sanitizedField.label).toStrictEqual('Do not label')
      expect(sanitizedField.type).toStrictEqual('text')
    })

    describe('opt-out', () => {
      it('should allow label opt-out', async () => {
        const fields: Field[] = [
          {
            label: false,
            name: 'someField',
            type: 'text',
          },
        ]
        const sanitizedField = (
          await sanitizeFields({
            config,
            fields,
            validRelationships: [],
          })
        )[0] as TextField
        expect(sanitizedField.name).toStrictEqual('someField')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('text')
      })

      it('should allow label opt-out for arrays', async () => {
        const arrayField: ArrayField = {
          fields: [
            {
              name: 'itemName',
              type: 'text',
            },
          ],
          label: false,
          name: 'items',
          type: 'array',
        }
        const sanitizedField = (
          await sanitizeFields({
            config,
            fields: [arrayField],
            validRelationships: [],
          })
        )[0] as ArrayField
        expect(sanitizedField.name).toStrictEqual('items')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('array')
        expect(sanitizedField.labels).toBeUndefined()
      })
      it('should allow label opt-out for blocks', async () => {
        const fields: Field[] = [
          {
            blocks: [
              {
                fields: [
                  {
                    name: 'testNumber',
                    type: 'number',
                  },
                ],
                slug: 'number',
              },
            ],
            label: false,
            name: 'noLabelBlock',
            type: 'blocks',
          },
        ]
        const sanitizedField = (
          await sanitizeFields({
            config,
            fields,
            validRelationships: [],
          })
        )[0] as BlockField
        expect(sanitizedField.name).toStrictEqual('noLabelBlock')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('blocks')
        expect(sanitizedField.labels).toBeUndefined()
      })
    })

    it('should label arrays with plural and singular', async () => {
      const fields: Field[] = [
        {
          fields: [
            {
              name: 'itemName',
              type: 'text',
            },
          ],
          name: 'items',
          type: 'array',
        },
      ]
      const sanitizedField = (
        await sanitizeFields({
          config,
          fields,
          validRelationships: [],
        })
      )[0] as ArrayField
      expect(sanitizedField.name).toStrictEqual('items')
      expect(sanitizedField.label).toStrictEqual('Items')
      expect(sanitizedField.type).toStrictEqual('array')
      expect(sanitizedField.labels).toMatchObject({ plural: 'Items', singular: 'Item' })
    })

    it('should label blocks with plural and singular', async () => {
      const fields: Field[] = [
        {
          blocks: [
            {
              fields: [{ name: 'testNumber', type: 'number' }],
              slug: 'number',
            },
          ],
          name: 'specialBlock',
          type: 'blocks',
        },
      ]
      const sanitizedField = (
        await sanitizeFields({
          config,
          fields,
          validRelationships: [],
        })
      )[0] as BlockField
      expect(sanitizedField.name).toStrictEqual('specialBlock')
      expect(sanitizedField.label).toStrictEqual('Special Block')
      expect(sanitizedField.type).toStrictEqual('blocks')
      expect(sanitizedField.labels).toMatchObject({
        plural: 'Special Blocks',
        singular: 'Special Block',
      })
      expect((sanitizedField.blocks[0].fields[0] as NumberField).label).toStrictEqual('Test Number')
    })
  })

  describe('relationships', () => {
    it('should not throw on valid relationship', async () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: 'some-collection',
          type: 'relationship',
        },
      ]
      await expect(async () => {
        await sanitizeFields({ config, fields, validRelationships })
      }).not.toThrow()
    })

    it('should not throw on valid relationship - multiple', async () => {
      const validRelationships = ['some-collection', 'another-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: ['some-collection', 'another-collection'],
          type: 'relationship',
        },
      ]
      await expect(async () => {
        await sanitizeFields({ config, fields, validRelationships })
      }).not.toThrow()
    })

    it('should not throw on valid relationship inside blocks', async () => {
      const validRelationships = ['some-collection']
      const relationshipBlock: Block = {
        fields: [
          {
            label: 'my-relationship',
            name: 'My Relationship',
            relationTo: 'some-collection',
            type: 'relationship',
          },
        ],
        slug: 'relationshipBlock',
      }
      const fields: Field[] = [
        {
          blocks: [relationshipBlock],
          label: 'Layout Blocks',
          name: 'layout',
          type: 'blocks',
        },
      ]
      await expect(async () => {
        await sanitizeFields({ config, fields, validRelationships })
      }).not.toThrow()
    })

    it('should throw on invalid relationship', async () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: 'not-valid',
          type: 'relationship',
        },
      ]
      await expect(async () => {
        await sanitizeFields({ config, fields, validRelationships })
      }).rejects.toThrow(InvalidFieldRelationship)
    })

    it('should throw on invalid relationship - multiple', async () => {
      const validRelationships = ['some-collection', 'another-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: ['some-collection', 'not-valid'],
          type: 'relationship',
        },
      ]
      await expect(async () => {
        await sanitizeFields({ config, fields, validRelationships })
      }).rejects.toThrow(InvalidFieldRelationship)
    })

    it('should throw on invalid relationship inside blocks', async () => {
      const validRelationships = ['some-collection']
      const relationshipBlock: Block = {
        fields: [
          {
            label: 'my-relationship',
            name: 'My Relationship',
            relationTo: 'not-valid',
            type: 'relationship',
          },
        ],
        slug: 'relationshipBlock',
      }
      const fields: Field[] = [
        {
          blocks: [relationshipBlock],
          label: 'Layout Blocks',
          name: 'layout',
          type: 'blocks',
        },
      ]
      await expect(async () => {
        await sanitizeFields({ config, fields, validRelationships })
      }).rejects.toThrow(InvalidFieldRelationship)
    })

    it('should defaultValue of checkbox to false if required and undefined', async () => {
      const fields: Field[] = [
        {
          name: 'My Checkbox',
          required: true,
          type: 'checkbox',
        },
      ]

      const sanitizedField = (
        await sanitizeFields({
          config,
          fields,
          validRelationships: [],
        })
      )[0] as CheckboxField
      expect(sanitizedField.defaultValue).toStrictEqual(false)
    })

    it('should return empty field array if no fields', async () => {
      const sanitizedFields = await sanitizeFields({
        config,
        fields: [],
        validRelationships: [],
      })
      expect(sanitizedFields).toStrictEqual([])
    })
  })
})
