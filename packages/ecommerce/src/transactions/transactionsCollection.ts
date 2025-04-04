import type { CollectionConfig, Field, SelectField } from 'payload'

import { de } from 'payload/i18n/de'

import type { CurrenciesConfig, FieldsOverride, PaymentAdapter } from '../types.js'

import { amountField } from '../fields/amountField.js'
import { cartItemsField } from '../fields/cartItemsField.js'
import { currencyField } from '../fields/currencyField.js'
import { statusField } from '../fields/statusField.js'
import { afterChange } from './hooks/afterChange.js'
import { beforeChange } from './hooks/beforeChange.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  customersCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  paymentMethods?: PaymentAdapter[]
}

export const transactionsCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    currenciesConfig,
    customersCollectionSlug = 'users',
    overrides,
    paymentMethods,
  } = props || {}
  const { defaultCurrency, supportedCurrencies } = currenciesConfig || {}

  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: customersCollectionSlug,
      required: true,
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
    },
    statusField(),
    cartItemsField({ currenciesConfig, overrides: { name: 'cartSnapshot', minRows: 1 } }),
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
    slug: 'transactions',
    ...overrides,
    admin: {
      defaultColumns: ['createdAt', 'customer', 'order', 'amount', 'status'],
      ...overrides?.admin,
    },
    fields,
    hooks: {
      ...overrides?.hooks,
      afterChange: [
        ...(currenciesConfig ? [afterChange({ currenciesConfig, paymentMethods })] : []),
        ...(overrides?.hooks?.afterChange || []),
      ],
      beforeChange: [
        ...(currenciesConfig ? [beforeChange({ currenciesConfig, paymentMethods })] : []),
        ...(overrides?.hooks?.beforeChange || []),
      ],
    },
  }

  return { ...baseConfig }
}
