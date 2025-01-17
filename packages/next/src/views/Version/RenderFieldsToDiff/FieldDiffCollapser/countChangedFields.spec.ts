import { countChangedFields } from './countChangedFields.js'
import type { ClientField } from 'payload'

describe('countChangedFields', () => {
  it('should return 0 when no fields have changed', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'number' },
    ]
    const comparison = { a: 'original', b: 123 }
    const version = { a: 'original', b: 123 }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(0)
  })

  it('should count simple changed fields', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'number' },
    ]
    const comparison = { a: 'original', b: 123 }
    const version = { a: 'changed', b: 123 }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(1)
  })

  it('should count previewsly undfined fields', () => {
    const fields: ClientField[] = [
      { name: 'a', type: 'text' },
      { name: 'b', type: 'number' },
    ]
    const comparison = {}
    const version = { a: 'new', b: 123 }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(2)
  })

  it('should not count the id field because it is not displayed in the version view', () => {
    const fields: ClientField[] = [
      { name: 'id', type: 'text' },
      { name: 'a', type: 'text' },
    ]
    const comparison = { id: 'original', a: 'original' }
    const version = { id: 'changed', a: 'original' }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { a: 'original', b: 'original', c: 'original' }
    const version = { a: 'changed', b: 'changed', c: 'original' }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { a: 'original', b: 'original', c: 'original' }
    const version = { a: 'changed', b: 'changed', c: 'original' }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { group: { a: 'original', b: 'original', c: 'original' } }
    const version = { group: { a: 'changed', b: 'changed', c: 'original' } }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { a: 'original', b: 'original', c: 'original' }
    const version = { a: 'changed', b: 'changed', c: 'original' }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { namedTab: { a: 'original', b: 'original', c: 'original' } }
    const version = { namedTab: { a: 'changed', b: 'changed', c: 'original' } }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { a: 'original', b: 'original' }
    const version = { a: 'original', b: 'changed' }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(0)
  })

  it('should cound changed fields inside array fields', () => {
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
    const comparison = {
      arrayField: [
        { a: 'original', b: 'original', c: 'original' },
        { a: 'original', b: 'original' },
      ],
    }
    const version = {
      arrayField: [
        { a: 'changed', b: 'changed', c: 'original' },
        { a: 'changed', b: 'changed', c: 'changed' },
      ],
    }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = { arrayField: [{ a: 'original', b: 'original', c: 'original' }] }
    const version = { arrayField: [{ a: 'changed', b: 'changed', c: 'original' }] }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = {
      blocks: [
        { blockType: 'blockA', a: 'original', b: 'original', c: 'original' },
        { blockType: 'blockA', a: 'original', b: 'original' },
      ],
    }
    const version = {
      blocks: [
        { blockType: 'blockA', a: 'changed', b: 'changed', c: 'original' },
        { blockType: 'blockA', a: 'changed', b: 'changed', c: 'changed' },
      ],
    }

    const result = countChangedFields({ comparison, fields, version })
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
    const comparison = {
      blocks: [{ blockType: 'blockA', a: 'removed', b: 'original', c: 'original' }],
    }
    const version = {
      blocks: [{ blockType: 'blockB', b: 'original', c: 'changed', d: 'new' }],
    }

    const result = countChangedFields({ comparison, fields, version })
    expect(result).toBe(3)
  })
})
