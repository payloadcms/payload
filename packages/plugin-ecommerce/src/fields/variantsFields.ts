import type { Field } from 'payload'

type Props = {
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
  /**
   * Slug of the variant types collection, defaults to 'variantTypes'.
   */
  variantTypesSlug?: string
}

export const variantsFields: (props: Props) => Field[] = ({
  variantsSlug = 'variants',
  variantTypesSlug = 'variantTypes',
}) => {
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
      relationTo: variantTypesSlug,
    },
    {
      name: 'variants',
      type: 'join',
      admin: {
        condition: ({ enableVariants }) => Boolean(enableVariants),
        defaultColumns: ['title', 'options', 'inventory', 'prices'],
        disableListColumn: true,
      },
      collection: variantsSlug,
      label: 'Available Variants',
      maxDepth: 2,
      on: 'product',
    },
  ]

  return fields
}
