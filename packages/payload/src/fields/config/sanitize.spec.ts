import type { Config } from '../../config/types.js'
import type {
  ArrayField,
  Block,
  BlocksField,
  CheckboxField,
  Field,
  NumberField,
  RichTextField,
  TextField,
} from './types.js'

import {
  DuplicateFieldName,
  InvalidFieldName,
  InvalidFieldRelationship,
  MissingFieldType,
} from '../../errors/index.js'
import { sanitizeFields } from './sanitize.js'
import { CollectionConfig } from '../../index.js'
import { describe, it, expect } from 'vitest'

describe('sanitizeFields', () => {
  const config = {} as Config
  const collectionConfig = {} as CollectionConfig

  it('should throw on missing type field', () => {
    const fields: Field[] = [
      // @ts-expect-error
      {
        name: 'Some Collection',
        label: 'some-collection',
      },
    ]

    expect(() => {
      sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })
    }).toThrow(MissingFieldType)
  })

  it('should throw on invalid field name', () => {
    const fields: Field[] = [
      {
        name: 'some.collection',
        type: 'text',
        label: 'some.collection',
      },
    ]

    expect(() => {
      sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })
    }).toThrow(InvalidFieldName)
  })

  it('should throw on duplicate field name', () => {
    const fields: Field[] = [
      {
        name: 'someField',
        type: 'text',
        label: 'someField',
      },
      {
        name: 'someField',
        type: 'text',
        label: 'someField',
      },
    ]

    expect(() => {
      sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })
    }).toThrow(DuplicateFieldName)
  })

  it('should throw on duplicate block slug', () => {
    const fields: Field[] = [
      {
        name: 'blocks',
        type: 'blocks',
        blocks: [
          {
            slug: 'block',
            fields: [
              {
                name: 'blockField',
                type: 'text',
              },
            ],
          },
          {
            slug: 'block',
            fields: [
              {
                name: 'blockField',
                type: 'text',
              },
            ],
          },
        ],
      },
    ]

    expect(() => {
      sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })
    }).toThrow(DuplicateFieldName)
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
        config,
        collectionConfig,
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
          name: 'someField',
          type: 'text',
          label: 'Do not label',
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
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
            name: 'someField',
            type: 'text',
            label: false,
          },
        ]

        const sanitizedField = sanitizeFields({
          config,
          collectionConfig,
          fields,
          validRelationships: [],
        })[0] as TextField

        expect(sanitizedField.name).toStrictEqual('someField')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('text')
      })

      it('should allow label opt-out for arrays', () => {
        const arrayField: ArrayField = {
          name: 'items',
          type: 'array',
          fields: [
            {
              name: 'itemName',
              type: 'text',
            },
          ],
          label: false,
        }

        const sanitizedField = sanitizeFields({
          config,
          collectionConfig,
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
            name: 'noLabelBlock',
            type: 'blocks',
            blocks: [
              {
                slug: 'number',
                fields: [
                  {
                    name: 'testNumber',
                    type: 'number',
                  },
                ],
              },
            ],
            label: false,
          },
        ]

        const sanitizedField = sanitizeFields({
          config,
          collectionConfig,
          fields,
          validRelationships: [],
        })[0] as BlocksField

        expect(sanitizedField.name).toStrictEqual('noLabelBlock')
        expect(sanitizedField.label).toStrictEqual(false)
        expect(sanitizedField.type).toStrictEqual('blocks')
        expect(sanitizedField.labels).toBeUndefined()
      })
    })

    it('should label arrays with plural and singular', () => {
      const fields: Field[] = [
        {
          name: 'items',
          type: 'array',
          fields: [
            {
              name: 'itemName',
              type: 'text',
            },
          ],
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
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
          name: 'specialBlock',
          type: 'blocks',
          blocks: [
            {
              slug: 'number',
              fields: [{ name: 'testNumber', type: 'number' }],
            },
          ],
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as BlocksField

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
          name: 'My Relationship',
          type: 'relationship',
          label: 'my-relationship',
          relationTo: 'some-collection',
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).not.toThrow()
    })

    it('should not throw on valid relationship - multiple', () => {
      const validRelationships = ['some-collection', 'another-collection']
      const fields: Field[] = [
        {
          name: 'My Relationship',
          type: 'relationship',
          label: 'my-relationship',
          relationTo: ['some-collection', 'another-collection'],
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).not.toThrow()
    })

    it('should not throw on valid relationship inside blocks', () => {
      const validRelationships = ['some-collection']
      const relationshipBlock: Block = {
        slug: 'relationshipBlock',
        fields: [
          {
            name: 'My Relationship',
            type: 'relationship',
            label: 'my-relationship',
            relationTo: 'some-collection',
          },
        ],
      }

      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [relationshipBlock],
          label: 'Layout Blocks',
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).not.toThrow()
    })

    it('should throw on invalid relationship', () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          name: 'My Relationship',
          type: 'relationship',
          label: 'my-relationship',
          relationTo: 'not-valid',
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).toThrow(InvalidFieldRelationship)
    })

    it('should throw on invalid relationship - multiple', () => {
      const validRelationships = ['some-collection', 'another-collection']
      const fields: Field[] = [
        {
          name: 'My Relationship',
          type: 'relationship',
          label: 'my-relationship',
          relationTo: ['some-collection', 'not-valid'],
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).toThrow(InvalidFieldRelationship)
    })

    it('should throw on invalid relationship inside blocks', () => {
      const validRelationships = ['some-collection']
      const relationshipBlock: Block = {
        slug: 'relationshipBlock',
        fields: [
          {
            name: 'My Relationship',
            type: 'relationship',
            label: 'my-relationship',
            relationTo: 'not-valid',
          },
        ],
      }

      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [relationshipBlock],
          label: 'Layout Blocks',
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).toThrow(InvalidFieldRelationship)
    })

    it('should throw on empty relationTo array', () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          name: 'My Relationship',
          type: 'relationship',
          label: 'my-relationship',
          relationTo: [],
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).toThrow('has an empty relationTo array')
    })

    it('should throw on empty relationTo array for upload field', () => {
      const validRelationships = ['some-collection']
      const fields: Field[] = [
        {
          name: 'My Upload',
          type: 'upload',
          label: 'my-upload',
          relationTo: [],
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).toThrow('has an empty relationTo array')
    })

    it('should throw on empty relationTo array inside blocks', () => {
      const validRelationships = ['some-collection']
      const relationshipBlock: Block = {
        slug: 'relationshipBlock',
        fields: [
          {
            name: 'My Relationship',
            type: 'relationship',
            label: 'my-relationship',
            relationTo: [],
          },
        ],
      }

      const fields: Field[] = [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [relationshipBlock],
          label: 'Layout Blocks',
        },
      ]

      expect(() => {
        sanitizeFields({ config, collectionConfig, fields, validRelationships })
      }).toThrow('has an empty relationTo array')
    })

    it('should defaultValue of checkbox to false if required and undefined', () => {
      const fields: Field[] = [
        {
          name: 'My Checkbox',
          type: 'checkbox',
          required: true,
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as CheckboxField

      expect(sanitizedField.defaultValue).toStrictEqual(false)
    })

    it('should return empty field array if no fields', () => {
      const sanitizedFields = sanitizeFields({
        config,
        collectionConfig,
        fields: [],
        validRelationships: [],
      })

      expect(sanitizedFields).toStrictEqual([])
    })
  })

  describe('blocks', () => {
    it('should maintain admin.blockName true after sanitization', () => {
      const fields: Field[] = [
        {
          name: 'noLabelBlock',
          type: 'blocks',
          blocks: [
            {
              slug: 'number',
              admin: {
                disableBlockName: true,
              },
              fields: [
                {
                  name: 'testNumber',
                  type: 'number',
                },
              ],
            },
          ],
          label: false,
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as BlocksField

      const sanitizedBlock = sanitizedField.blocks[0]

      expect(sanitizedBlock.admin?.disableBlockName).toStrictEqual(true)
    })
    it('should default admin.disableBlockName to true after sanitization', () => {
      const fields: Field[] = [
        {
          name: 'noLabelBlock',
          type: 'blocks',
          blocks: [
            {
              slug: 'number',
              fields: [
                {
                  name: 'testNumber',
                  type: 'number',
                },
              ],
            },
          ],
          label: false,
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as BlocksField

      const sanitizedBlock = sanitizedField.blocks[0]

      expect(sanitizedBlock.admin?.disableBlockName).toStrictEqual(undefined)
    })
  })

  describe('virtual fields', () => {
    it('should assign a noop validate for virtual: true fields', () => {
      const fields: Field[] = [
        {
          name: 'virtualText',
          type: 'text',
          virtual: true,
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.validate).toBeDefined()
      expect(sanitizedField.validate!('', {} as any)).toBe(true)
      expect(sanitizedField.validate!(undefined as any, {} as any)).toBe(true)
    })

    it('should assign a noop validate for virtual: "string" fields', () => {
      const fields: Field[] = [
        {
          name: 'virtualRef',
          type: 'text',
          virtual: 'post.title',
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.validate).toBeDefined()
      expect(sanitizedField.validate!(undefined as any, {} as any)).toBe(true)
    })

    it('should not override an explicit validate on a virtual field', () => {
      const customValidate = () => true as const
      const fields: Field[] = [
        {
          name: 'virtualText',
          type: 'text',
          virtual: true,
          validate: customValidate,
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.validate).toBe(customValidate)
    })

    it('should assign default type-based validate for non-virtual fields', () => {
      const fields: Field[] = [
        {
          name: 'normalText',
          type: 'text',
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.validate).toBeDefined()
      // Non-virtual text field should use the text validator which checks required/minLength/etc.
      // Passing undefined with required should fail
      const result = sanitizedField.validate!(
        undefined as any,
        { required: true, req: { payload: { config: {} }, t: ((v: string) => v) as any } } as any,
      )
      expect(result).not.toBe(true)
    })

    it('should default readOnly to true for virtual: true fields', () => {
      const fields: Field[] = [
        {
          name: 'virtualText',
          type: 'text',
          virtual: true,
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.admin?.readOnly).toBe(true)
    })

    it('should default readOnly to true for virtual: "string" fields', () => {
      const fields: Field[] = [
        {
          name: 'virtualRef',
          type: 'text',
          virtual: 'post.title',
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.admin?.readOnly).toBe(true)
    })

    it('should not override readOnly: false on virtual fields', () => {
      const fields: Field[] = [
        {
          name: 'virtualText',
          type: 'text',
          virtual: true,
          admin: { readOnly: false },
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.admin?.readOnly).toBe(false)
    })

    it('should not set readOnly on non-virtual fields', () => {
      const fields: Field[] = [
        {
          name: 'normalText',
          type: 'text',
        },
      ]

      const sanitizedField = sanitizeFields({
        config,
        collectionConfig,
        fields,
        validRelationships: [],
      })[0] as TextField

      expect(sanitizedField.admin?.readOnly).toBeUndefined()
    })
  })
})
