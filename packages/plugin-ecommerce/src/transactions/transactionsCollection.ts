import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride, PaymentAdapter } from '../types.js'

import { amountField } from '../fields/amountField.js'
import { currencyField } from '../fields/currencyField.js'
import { statusField } from '../fields/statusField.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  /**
   * Slug of the orders collection, defaults to 'orders'.
   */
  ordersSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  paymentMethods?: PaymentAdapter[]
}

export const transactionsCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    currenciesConfig,
    customersSlug = 'users',
    ordersSlug = 'orders',
    overrides,
    paymentMethods,
  } = props || {}

  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customer'),
      relationTo: customersSlug,
    },
    {
      name: 'customerEmail',
      type: 'email',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customerEmail'),
    },
    {
      name: 'order',
      type: 'relationship',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:order'),
      relationTo: ordersSlug,
    },
    statusField(),
  ]

  if (paymentMethods?.length && paymentMethods.length > 0) {
    defaultFields.push({
      name: 'paymentMethod',
      type: 'select',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:paymentMethod'),
      options: paymentMethods.map((method) => ({
        label: method.label ?? method.name,
        value: method.name,
      })),
    })

    paymentMethods.forEach((method) => {
      defaultFields.push(method.group)
    })
  }

  if (currenciesConfig) {
    defaultFields.push(currencyField({ currenciesConfig }))
    defaultFields.push(amountField({ currenciesConfig }))
  }

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'transactions',
    ...overrides,
    access: {
      read: () => true,
      ...(overrides?.access || []),
    },
    admin: {
      defaultColumns: ['createdAt', 'customer', 'order', 'amount', 'status'],
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
