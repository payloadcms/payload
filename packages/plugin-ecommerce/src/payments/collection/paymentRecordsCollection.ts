import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride, PaymentAdapter } from '../../types.js'

import { amountField } from '../../fields/amountField.js'
import { currencyField } from '../../fields/currencyField.js'
import { statusField } from '../../fields/statusField.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  customersCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  paymentMethods?: PaymentAdapter[]
}

export const paymentRecordsCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    currenciesConfig,
    customersCollectionSlug = 'users',
    overrides,
    paymentMethods,
  } = props || {}

  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: customersCollectionSlug,
    },
    {
      name: 'customerEmail',
      type: 'email',
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
    },
    statusField(),
  ]

  if (paymentMethods?.length && paymentMethods.length > 0) {
    defaultFields.push({
      name: 'paymentMethod',
      type: 'select',
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
    slug: 'paymentRecords',
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
