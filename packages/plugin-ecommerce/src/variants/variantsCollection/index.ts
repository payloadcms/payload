import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, Currency, FieldsOverride } from '../../types.js'

import { pricesField } from '../../fields/pricesField.js'
import { variantsCollectionBeforeChange as beforeChange } from './hooks/beforeChange.js'
import { validateOptions } from './hooks/validateOptions.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const variantsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { currenciesConfig, overrides } = props || {}
  const { defaultCurrency, supportedCurrencies } = currenciesConfig || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      admin: {
        description:
          'Used for administrative purposes, not shown to customers. This is populated by default.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      admin: {
        description:
          'this should not be editable, or at least, should be able to be pre-filled via default',
        readOnly: true,
      },
      relationTo: 'products',
      required: true,
    },
    {
      // This might need to be a custom component, to show a selector for each variant that is
      // enabled on the parent product
      // - separate select inputs, each showing only a specific variant (w/ options)
      // - it will save data to the DB as IDs in this relationship field
      // and needs a validate function as well which enforces that the options are fully specified,
      // and accurate
      name: 'options',
      type: 'relationship',
      admin: {
        components: {
          Field: {
            path: '@payloadcms/plugin-ecommerce/ui#VariantOptionsSelector',
          },
        },
      },
      label: 'Variant options',
      required: true,
      // filterOptions: async ({ data, req, siblingData }) => {
      //   const productID = data.product
      //   const product = await req.payload.findByID({
      //     id: productID,
      //     collection: 'products',
      //   })

      //   const variantTypes: (number | string)[] = []

      //   product.variantTypes.forEach((key: any) => {
      //     if (typeof key === 'string' || typeof key === 'number') {
      //       variantTypes.push(key)
      //     } else {
      //       variantTypes.push(key.id)
      //     }
      //   })

      //   // @ts-expect-error - filterOptions are not typed well yet
      //   const selectedOptions = siblingData.options || []
      //   const ignoredGroups: (number | string)[] = []

      //   if (selectedOptions.length > 0) {
      //     for (const selectedOption of selectedOptions) {
      //       const option = await req.payload.findByID({
      //         id: selectedOption,
      //         collection: 'variantOptions',
      //       })

      //       if (!option) {
      //         continue
      //       }

      //       const { variantType } = option

      //       if (ignoredGroups.includes(variantType)) {
      //         continue
      //       }

      //       const keyID =
      //         typeof variantType === 'string' || typeof variantType === 'number'
      //           ? variantType
      //           : variantType.id

      //       ignoredGroups.push(keyID)
      //     }
      //   }

      //   if (!variantTypes.length) {
      //     return true
      //   }

      //   return {
      //     and: [
      //       {
      //         variantType: { in: variantTypes },
      //       },
      //       ...(ignoredGroups.length > 0
      //         ? [
      //             {
      //               variantType: { not_in: ignoredGroups },
      //             },
      //           ]
      //         : []),
      //     ],
      //   }
      // },
      hasMany: true,
      relationTo: 'variantOptions',
      validate: validateOptions(),
    },
    {
      name: 'inventory',
      type: 'number',
      admin: {
        step: 1,
      },
      required: true,
    },
  ]

  if (supportedCurrencies?.length && supportedCurrencies.length > 0) {
    const currencyOptions: string[] = []

    supportedCurrencies.forEach((currency) => {
      currencyOptions.push(currency.code)
    })

    if (currenciesConfig) {
      defaultFields.push(...pricesField({ currenciesConfig }))
    }
  }

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'variants',
    ...overrides,
    admin: {
      // group: false,
      useAsTitle: 'title',
      ...overrides?.admin,
    },
    fields,
    hooks: {
      ...overrides?.hooks,
      beforeChange: [beforeChange(), ...(overrides?.hooks?.beforeChange || [])],
    },
  }

  return { ...baseConfig }
}
