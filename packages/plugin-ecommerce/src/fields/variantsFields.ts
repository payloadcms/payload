import type { Field } from 'payload'

export const variantsFields: () => Field[] = () => {
  const fields: Field[] = [
    {
      name: 'enableVariants',
      type: 'checkbox',
    },
    {
      name: 'variantTypes',
      type: 'relationship',
      admin: {
        condition: ({ enableVariants }) => Boolean(enableVariants),
      },
      hasMany: true,
      relationTo: 'variantTypes',
    },
    {
      name: 'variants',
      type: 'join',
      admin: {
        condition: ({ enableVariants }) => Boolean(enableVariants),
        defaultColumns: ['title', 'options', 'inventory', 'prices'],
        disableListColumn: true,
      },
      collection: 'variants',
      label: 'Available Variants',
      maxDepth: 2,
      on: 'product',
    },
  ]

  return fields
}
