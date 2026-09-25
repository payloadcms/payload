import type { Field } from 'payload'

export const defaultPaymentFields: Field = {
  name: 'payment',
  type: 'group',
  fields: [
    {
      name: 'field',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:field'),
    },
    {
      name: 'status',
      type: 'text',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:paymentStatus'),
    },
    {
      name: 'amount',
      type: 'number',
      admin: {
        description: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:amountInCents'),
      },
    },
    {
      name: 'paymentProcessor',
      type: 'text',
    },
    {
      name: 'creditCard',
      type: 'group',
      fields: [
        {
          name: 'token',
          type: 'text',
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:token'),
        },
        {
          name: 'brand',
          type: 'text',
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:brand'),
        },
        {
          name: 'number',
          type: 'text',
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:numberSingular'),
        },
      ],
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:creditCard'),
    },
  ],
}
