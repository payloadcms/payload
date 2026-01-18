import type { Field } from '@ruya.sa/payload'

export const defaultPaymentFields: Field = {
  name: 'payment',
  type: 'group',
  fields: [
    {
      name: 'field',
      type: 'text',
      label: 'Field',
    },
    {
      name: 'status',
      type: 'text',
      label: 'Status',
    },
    {
      name: 'amount',
      type: 'number',
      admin: {
        description: 'Amount in cents',
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
          label: 'token',
        },
        {
          name: 'brand',
          type: 'text',
          label: 'Brand',
        },
        {
          name: 'number',
          type: 'text',
          label: 'Number',
        },
      ],
      label: 'Credit Card',
    },
  ],
}
