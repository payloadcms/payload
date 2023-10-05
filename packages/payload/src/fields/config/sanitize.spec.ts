import type {
  ArrayField,
  Block,
  BlockField,
  CheckboxField,
  Field,
  NumberField,
  TextField,
} from './types'
import { Config } from '../../config/types'
import { InvalidFieldName, InvalidFieldRelationship, MissingFieldType } from '../../errors'
import { sanitizeFields } from './sanitize'
import { DatabaseAdapter } from '../..'

const dummyConfig: Config = {
  collections: [],
  db: () => ({}) as DatabaseAdapter,
}

describe('sanitizeFields', () => {
  it('should throw on missing type field', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const fields: Field[] = [
      {
        label: 'some-collection',
        name: 'Some Collection',
      },
    ]
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })
    }).toThrow(MissingFieldType)
  })
  it('should throw on invalid field name', () => {
    const fields: Field[] = [
      {
        label: 'some.collection',
        name: 'some.collection',
        type: 'text',
      },
    ]
    expect(() => {
      sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })
    }).toThrow(InvalidFieldName)
  })

  describe('auto-labeling', () => {
    it('should populate label if missing', () => {
      const fields: Field[] = [
        {
          name: 'someField',
          type: 'text',
        },
      ]
      const sanitizedField = sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })[0] as TextField
      expect(sanitizedField.name).toStrictEqual('someField')
      expect(sanitizedField.label).toStrictEqual('Some Field')
      expect(sanitizedField.type).toStrictEqual('text')
    })
    it('should allow auto-label override', () => {
      const fields: Field[] = [
        {
          label: 'Do not label',
          name: 'someField',
          type: 'text',
        },
      ]
      const sanitizedField = sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })[0] as TextField
      expect(sanitizedField.name).toStrictEqual('someField')
      expect(sanitizedField.label).toStrictEqual('Do not label')
      expect(sanitizedField.type).toStrictEqual('text')
    })

    describe('opt-out', () => {
      it('should allow label opt-out', () => {
        const fields: Field[] = [
          {
            label: false,
            name: 'someField',
            type: 'text',
          },
        ]
        const sanitizedField = sanitizeFields({
          config: dummyConfig,
          fields,
          validRelationships: [],
        })[0] as TextField
        expect(sanitizedField.name).toStrictEqual('someField')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('text')
      })

      it('should allow label opt-out for arrays', () => {
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
        const sanitizedField = sanitizeFields({
          config: dummyConfig,
          fields: [arrayField],
          validRelationships: [],
        })[0] as ArrayField
        expect(sanitizedField.name).toStrictEqual('items')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('array')
        expect(sanitizedField.labels).toBeUndefined()
      })
      it('should allow label opt-out for blocks', () => {
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
        const sanitizedField = sanitizeFields({
          config: dummyConfig,
          fields,
          validRelationships: [],
        })[0] as BlockField
        expect(sanitizedField.name).toStrictEqual('noLabelBlock')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('blocks')
        expect(sanitizedField.labels).toBeUndefined()
      })
    })

    it('should label arrays with plural and singular', () => {
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
      const sanitizedField = sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })[0] as ArrayField
      expect(sanitizedField.name).toStrictEqual('items')
      expect(sanitizedField.label).toStrictEqual('Items')
      expect(sanitizedField.type).toStrictEqual('array')
      expect(sanitizedField.labels).toMatchObject({ plural: 'Items', singular: 'Item' })
    })

    it('should label blocks with plural and singular', () => {
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
      const sanitizedField = sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })[0] as BlockField
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
    it('should not throw on valid relationship', () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: 'some-collection',
          type: 'relationship',
        },
      ]
      expect(() => {
        sanitizeFields({ config: dummyConfig, fields, validRelationships })
      }).not.toThrow()
    })

    it('should not throw on valid relationship - multiple', () => {
      const validRelationships = ['some-collection', 'another-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: ['some-collection', 'another-collection'],
          type: 'relationship',
        },
      ]
      expect(() => {
        sanitizeFields({ config: dummyConfig, fields, validRelationships })
      }).not.toThrow()
    })

    it('should not throw on valid relationship inside blocks', () => {
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
      expect(() => {
        sanitizeFields({ config: dummyConfig, fields, validRelationships })
      }).not.toThrow()
    })

    it('should throw on invalid relationship', () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: 'not-valid',
          type: 'relationship',
        },
      ]
      expect(() => {
        sanitizeFields({ config: dummyConfig, fields, validRelationships })
      }).toThrow(InvalidFieldRelationship)
    })

    it('should throw on invalid relationship - multiple', () => {
      const validRelationships = ['some-collection', 'another-collection']
      const fields: Field[] = [
        {
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: ['some-collection', 'not-valid'],
          type: 'relationship',
        },
      ]
      expect(() => {
        sanitizeFields({ config: dummyConfig, fields, validRelationships })
      }).toThrow(InvalidFieldRelationship)
    })

    it('should throw on invalid relationship inside blocks', () => {
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
      expect(() => {
        sanitizeFields({ config: dummyConfig, fields, validRelationships })
      }).toThrow(InvalidFieldRelationship)
    })

    it('should defaultValue of checkbox to false if required and undefined', () => {
      const fields: Field[] = [
        {
          name: 'My Checkbox',
          required: true,
          type: 'checkbox',
        },
      ]

      const sanitizedField = sanitizeFields({
        config: dummyConfig,
        fields,
        validRelationships: [],
      })[0] as CheckboxField
      expect(sanitizedField.defaultValue).toStrictEqual(false)
    })

    it('should return empty field array if no fields', () => {
      const sanitizedFields = sanitizeFields({
        config: dummyConfig,
        fields: [],
        validRelationships: [],
      })
      expect(sanitizedFields).toStrictEqual([])
    })
  })
})
