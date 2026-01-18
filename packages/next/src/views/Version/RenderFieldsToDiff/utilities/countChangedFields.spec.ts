import type { ClientField } from '@ruya.sa/payload'
import { describe, it, expect } from 'vitest'

import { countChangedFields, countChangedFieldsInRows } from './countChangedFields.js'

describe('countChangedFields', () => {
  // locales can be undefined when not configured in payload.config.js
  const locales = undefined
  it('should return 0 when no fields have changed', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'number' },
    ]
    const valueFrom = { a: 'original', b: 123 }
    const valueTo = { a: 'original', b: 123 }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(0)
  })

  it('should count simple changed fields', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'number' },
    ]
    const valueFrom = { a: 'original', b: 123 }
    const valueTo = { a: 'changed', b: 123 }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(1)
  })

  it('should count previously undefined fields', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'number' },
    ]
    const valueFrom = {}
    const valueTo = { a: 'new', b: 123 }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should not count the id field because it is not displayed in the version view', () => {
    const fields: ClientField[] = [
      { name: 'id', type: 'text' },
      { name: 'a', type: 'text' },
    ]
    const valueFrom = { id: 'original', a: 'original' }
    const valueTo = { id: 'changed', a: 'original' }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(0)
  })

  it('should count changed fields inside collapsible fields', () => {
    const fields: ClientField[] = [
      {
        type: 'collapsible',
        label: 'A collapsible field',
        fields: [
          { name: 'a', type: 'text' },
          { name: 'b', type: 'text' },
          { name: 'c', type: 'text' },
        ],
      },
    ]
    const valueFrom = { a: 'original', b: 'original', c: 'original' }
    const valueTo = { a: 'changed', b: 'changed', c: 'original' }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should count changed fields inside row fields', () => {
    const fields: ClientField[] = [
      {
        type: 'row',
        fields: [
          { name: 'a', type: 'text' },
          { name: 'b', type: 'text' },
          { name: 'c', type: 'text' },
        ],
      },
    ]
    const valueFrom = { a: 'original', b: 'original', c: 'original' }
    const valueTo = { a: 'changed', b: 'changed', c: 'original' }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should count changed fields inside group fields', () => {
    const fields: ClientField[] = [
      {
        type: 'group',
        name: 'group',
        fields: [
          { name: 'a', type: 'text' },
          { name: 'b', type: 'text' },
          { name: 'c', type: 'text' },
        ],
      },
    ]
    const valueFrom = { group: { a: 'original', b: 'original', c: 'original' } }
    const valueTo = { group: { a: 'changed', b: 'changed', c: 'original' } }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should count changed fields inside unnamed tabs ', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Unnamed tab',
            fields: [
              { name: 'a', type: 'text' },
              { name: 'b', type: 'text' },
              { name: 'c', type: 'text' },
            ],
          },
        ],
      },
    ]
    const valueFrom = { a: 'original', b: 'original', c: 'original' }
    const valueTo = { a: 'changed', b: 'changed', c: 'original' }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should count changed fields inside named tabs ', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            name: 'namedTab',
            fields: [
              { name: 'a', type: 'text' },
              { name: 'b', type: 'text' },
              { name: 'c', type: 'text' },
            ],
          },
        ],
      },
    ]
    const valueFrom = { namedTab: { a: 'original', b: 'original', c: 'original' } }
    const valueTo = { namedTab: { a: 'changed', b: 'changed', c: 'original' } }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should ignore UI fields', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      {
        name: 'b',
        type: 'ui',
        admin: {},
      },
    ]
    const valueFrom = { a: 'original', b: 'original' }
    const valueTo = { a: 'original', b: 'changed' }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(0)
  })

  it('should count changed fields inside array fields', () => {
    const fields: ClientField[] = [
      {
        name: 'arrayField',
        type: 'array',
        fields: [
          {
            name: 'a',
            type: 'text',
          },
          {
            name: 'b',
            type: 'text',
          },
          {
            name: 'c',
            type: 'text',
          },
        ],
      },
    ]
    const valueFrom = {
      arrayField: [
        { a: 'original', b: 'original', c: 'original' },
        { a: 'original', b: 'original' },
      ],
    }
    const valueTo = {
      arrayField: [
        { a: 'changed', b: 'changed', c: 'original' },
        { a: 'changed', b: 'changed', c: 'changed' },
      ],
    }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(5)
  })

  it('should count changed fields inside arrays nested inside of collapsibles', () => {
    const fields: ClientField[] = [
      {
        type: 'collapsible',
        label: 'A collapsible field',
        fields: [
          {
            name: 'arrayField',
            type: 'array',
            fields: [
              {
                name: 'a',
                type: 'text',
              },
              {
                name: 'b',
                type: 'text',
              },
              {
                name: 'c',
                type: 'text',
              },
            ],
          },
        ],
      },
    ]
    const valueFrom = { arrayField: [{ a: 'original', b: 'original', c: 'original' }] }
    const valueTo = { arrayField: [{ a: 'changed', b: 'changed', c: 'original' }] }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(2)
  })

  it('should count changed fields inside blocks fields', () => {
    const fields: ClientField[] = [
      {
        name: 'blocks',
        type: 'blocks',
        blocks: [
          {
            slug: 'blockA',
            fields: [
              { name: 'a', type: 'text' },
              { name: 'b', type: 'text' },
              { name: 'c', type: 'text' },
            ],
          },
        ],
      },
    ]
    const valueFrom = {
      blocks: [
        { blockType: 'blockA', a: 'original', b: 'original', c: 'original' },
        { blockType: 'blockA', a: 'original', b: 'original' },
      ],
    }
    const valueTo = {
      blocks: [
        { blockType: 'blockA', a: 'changed', b: 'changed', c: 'original' },
        { blockType: 'blockA', a: 'changed', b: 'changed', c: 'changed' },
      ],
    }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(5)
  })

  it('should count changed fields between blocks with different slugs', () => {
    const fields: ClientField[] = [
      {
        name: 'blocks',
        type: 'blocks',
        blocks: [
          {
            slug: 'blockA',
            fields: [
              { name: 'a', type: 'text' },
              { name: 'b', type: 'text' },
              { name: 'c', type: 'text' },
            ],
          },
          {
            slug: 'blockB',
            fields: [
              { name: 'b', type: 'text' },
              { name: 'c', type: 'text' },
              { name: 'd', type: 'text' },
            ],
          },
        ],
      },
    ]
    const valueFrom = {
      blocks: [{ blockType: 'blockA', a: 'removed', b: 'original', c: 'original' }],
    }
    const valueTo = {
      blocks: [{ blockType: 'blockB', b: 'original', c: 'changed', d: 'new' }],
    }

    const result = countChangedFields({ valueFrom, fields, valueTo, locales })
    expect(result).toBe(3)
  })

  describe('localized fields', () => {
    const locales = ['en', 'de']
    it('should count simple localized fields', () => {
      const fields: ClientField[] = [
        { name: 'a', type: 'text', localized: true },
        { name: 'b', type: 'text', localized: true },
      ]
      const valueFrom = {
        a: { en: 'original', de: 'original' },
        b: { en: 'original', de: 'original' },
      }
      const valueTo = {
        a: { en: 'changed', de: 'original' },
        b: { en: 'original', de: 'original' },
      }
      const result = countChangedFields({ valueFrom, fields, valueTo, locales })
      expect(result).toBe(1)
    })

    it('should count multiple locales of the same localized field', () => {
      const locales = ['en', 'de']
      const fields: ClientField[] = [
        { name: 'a', type: 'text', localized: true },
        { name: 'b', type: 'text', localized: true },
      ]
      const valueFrom = {
        a: { en: 'original', de: 'original' },
        b: { en: 'original', de: 'original' },
      }
      const valueTo = {
        a: { en: 'changed', de: 'changed' },
        b: { en: 'original', de: 'original' },
      }
      const result = countChangedFields({ valueFrom, fields, valueTo, locales })
      expect(result).toBe(2)
    })

    it('should count changed fields inside localized groups fields', () => {
      const fields: ClientField[] = [
        {
          type: 'group',
          name: 'group',
          localized: true,
          fields: [
            { name: 'a', type: 'text' },
            { name: 'b', type: 'text' },
            { name: 'c', type: 'text' },
          ],
        },
      ]
      const valueFrom = {
        group: {
          en: { a: 'original', b: 'original', c: 'original' },
          de: { a: 'original', b: 'original', c: 'original' },
        },
      }
      const valueTo = {
        group: {
          en: { a: 'changed', b: 'changed', c: 'original' },
          de: { a: 'original', b: 'changed', c: 'original' },
        },
      }
      const result = countChangedFields({ valueFrom, fields, valueTo, locales })
      expect(result).toBe(3)
    })
    it('should count changed fields inside localized tabs', () => {
      const fields: ClientField[] = [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'tab',
              localized: true,
              fields: [
                { name: 'a', type: 'text' },
                { name: 'b', type: 'text' },
                { name: 'c', type: 'text' },
              ],
            },
          ],
        },
      ]
      const valueFrom = {
        tab: {
          en: { a: 'original', b: 'original', c: 'original' },
          de: { a: 'original', b: 'original', c: 'original' },
        },
      }
      const valueTo = {
        tab: {
          en: { a: 'changed', b: 'changed', c: 'original' },
          de: { a: 'original', b: 'changed', c: 'original' },
        },
      }
      const result = countChangedFields({ valueFrom, fields, valueTo, locales })
      expect(result).toBe(3)
    })

    it('should count changed fields inside localized array fields', () => {
      const fields: ClientField[] = [
        {
          name: 'arrayField',
          type: 'array',
          localized: true,
          fields: [
            {
              name: 'a',
              type: 'text',
            },
            {
              name: 'b',
              type: 'text',
            },
            {
              name: 'c',
              type: 'text',
            },
          ],
        },
      ]
      const valueFrom = {
        arrayField: {
          en: [{ a: 'original', b: 'original', c: 'original' }],
          de: [{ a: 'original', b: 'original', c: 'original' }],
        },
      }
      const valueTo = {
        arrayField: {
          en: [{ a: 'changed', b: 'changed', c: 'original' }],
          de: [{ a: 'original', b: 'changed', c: 'original' }],
        },
      }
      const result = countChangedFields({ valueFrom, fields, valueTo, locales })
      expect(result).toBe(3)
    })

    it('should count changed fields inside localized blocks fields', () => {
      const fields: ClientField[] = [
        {
          name: 'blocks',
          type: 'blocks',
          localized: true,
          blocks: [
            {
              slug: 'blockA',
              fields: [
                { name: 'a', type: 'text' },
                { name: 'b', type: 'text' },
                { name: 'c', type: 'text' },
              ],
            },
          ],
        },
      ]
      const valueFrom = {
        blocks: {
          en: [{ blockType: 'blockA', a: 'original', b: 'original', c: 'original' }],
          de: [{ blockType: 'blockA', a: 'original', b: 'original', c: 'original' }],
        },
      }
      const valueTo = {
        blocks: {
          en: [{ blockType: 'blockA', a: 'changed', b: 'changed', c: 'original' }],
          de: [{ blockType: 'blockA', a: 'original', b: 'changed', c: 'original' }],
        },
      }
      const result = countChangedFields({ valueFrom, fields, valueTo, locales })
      expect(result).toBe(3)
    })
  })
})

describe('countChangedFieldsInRows', () => {
  it('should count fields in array rows', () => {
    const field: ClientField = {
      name: 'myArray',
      type: 'array',
      fields: [
        { name: 'a', type: 'text' },
        { name: 'b', type: 'text' },
        { name: 'c', type: 'text' },
      ],
    }

    const valueFromRows = [{ a: 'original', b: 'original', c: 'original' }]
    const valueToRows = [{ a: 'changed', b: 'changed', c: 'original' }]

    const result = countChangedFieldsInRows({
      valueFromRows,
      field,
      locales: undefined,
      valueToRows: valueToRows,
    })
    expect(result).toBe(2)
  })

  it('should count fields in blocks', () => {
    const field: ClientField = {
      name: 'myBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'blockA',
          fields: [
            { name: 'a', type: 'text' },
            { name: 'b', type: 'text' },
            { name: 'c', type: 'text' },
          ],
        },
      ],
    }

    const valueFromRows = [{ blockType: 'blockA', a: 'original', b: 'original', c: 'original' }]
    const valueToRows = [{ blockType: 'blockA', a: 'changed', b: 'changed', c: 'original' }]

    const result = countChangedFieldsInRows({
      valueFromRows,
      field,
      locales: undefined,
      valueToRows,
    })
    expect(result).toBe(2)
  })
})
