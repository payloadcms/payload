import type { Field } from '@ruya.sa/payload'

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
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:enableVariants'),
    },
    {
      name: 'variantTypes',
      type: 'relationship',
      admin: {
        condition: ({ enableVariants }) => Boolean(enableVariants),
      },
      hasMany: true,
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:variantTypes'),
      relationTo: variantTypesSlug,
    },
    {
      name: 'variants',
      type: 'join',
      admin: {
        condition: ({ enableVariants, variantTypes }) => {
          const enabledVariants = Boolean(enableVariants)
          const hasManyVariantTypes = Array.isArray(variantTypes) && variantTypes.length > 0

          return enabledVariants && hasManyVariantTypes
        },
        defaultColumns: ['title', 'options', 'inventory', 'prices', '_status'],
        disableListColumn: true,
      },
      collection: variantsSlug,
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:availableVariants'),
      maxDepth: 2,
      on: 'product',
    },
  ]

  return fields
}
