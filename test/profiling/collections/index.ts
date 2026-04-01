import type { CollectionConfig, Field } from 'payload'

function createNestedFields(depth: number, prefix: string): Field[] {
  if (depth === 0) {
    return [{ name: `${prefix}_text`, type: 'text' }]
  }

  return [
    {
      name: `${prefix}_group`,
      type: 'group',
      fields: createNestedFields(depth - 1, `${prefix}_g`),
    },
    {
      name: `${prefix}_array`,
      type: 'array',
      fields: createNestedFields(depth - 1, `${prefix}_a`),
    },
    {
      type: 'tabs',
      tabs: [
        { label: 'Tab1', fields: createNestedFields(depth - 1, `${prefix}_t1`) },
        { label: 'Tab2', fields: createNestedFields(depth - 1, `${prefix}_t2`) },
      ],
    },
  ]
}

export function generateCollections(count: number): CollectionConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `collection-${i}`,
    fields: [
      ...createNestedFields(4, `c${i}`),
      { name: 'richText', type: 'richText' },
      {
        name: 'virtual',
        type: 'text',
        virtual: true,
        hooks: { beforeRead: [() => 'computed'] },
      },
    ],
  }))
}
