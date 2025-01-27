import type { Block, Field } from 'payload/types'

import type { FieldConfig, PaymentFieldConfig } from '../../types'

import { DynamicFieldSelector } from './DynamicFieldSelector'
import { DynamicPriceSelector } from './DynamicPriceSelector'

const name: Field = {
  name: 'name',
  label: 'Name (lowercase, no special characters)',
  required: true,
  type: 'text',
}

const label: Field = {
  name: 'label',
  label: 'Label',
  localized: true,
  type: 'text',
}

const required: Field = {
  name: 'required',
  label: 'Required',
  type: 'checkbox',
}

const width: Field = {
  name: 'width',
  label: 'Field Width (percentage)',
  type: 'number',
}

const Select: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          admin: {
            width: '50%',
          },
          label: 'Default Value',
          localized: true,
          type: 'text',
        },
      ],
      type: 'row',
    },
    {
      name: 'options',
      fields: [
        {
          fields: [
            {
              name: 'label',
              admin: {
                width: '50%',
              },
              label: 'Label',
              localized: true,
              required: true,
              type: 'text',
            },
            {
              name: 'value',
              admin: {
                width: '50%',
              },
              label: 'Value',
              required: true,
              type: 'text',
            },
          ],
          type: 'row',
        },
      ],
      label: 'Select Attribute Options',
      labels: {
        plural: 'Options',
        singular: 'Option',
      },
      type: 'array',
    },
    required,
  ],
  labels: {
    plural: 'Select Fields',
    singular: 'Select',
  },
  slug: 'select',
}

const Text: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          admin: {
            width: '50%',
          },
          label: 'Default Value',
          localized: true,
          type: 'text',
        },
      ],
      type: 'row',
    },
    required,
  ],
  labels: {
    plural: 'Text Fields',
    singular: 'Text',
  },
  slug: 'text',
}

const TextArea: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          admin: {
            width: '50%',
          },
          label: 'Default Value',
          localized: true,
          type: 'text',
        },
      ],
      type: 'row',
    },
    required,
  ],
  labels: {
    plural: 'Text Area Fields',
    singular: 'Text Area',
  },
  slug: 'textarea',
}

const Number: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          admin: {
            width: '50%',
          },
          label: 'Default Value',
          type: 'number',
        },
      ],
      type: 'row',
    },
    required,
  ],
  labels: {
    plural: 'Number Fields',
    singular: 'Number',
  },
  slug: 'number',
}

const Email: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    width,
    required,
  ],
  labels: {
    plural: 'Email Fields',
    singular: 'Email',
  },
  slug: 'email',
}

const State: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    width,
    required,
  ],
  labels: {
    plural: 'State Fields',
    singular: 'State',
  },
  slug: 'state',
}

const Country: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    width,
    required,
  ],
  labels: {
    plural: 'Country Fields',
    singular: 'Country',
  },
  slug: 'country',
}

const Checkbox: Block = {
  fields: [
    {
      fields: [
        {
          ...name,
          admin: {
            width: '50%',
          },
        },
        {
          ...label,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          ...required,
          admin: {
            width: '50%',
          },
        },
      ],
      type: 'row',
    },
    {
      name: 'defaultValue',
      label: 'Default Value',
      type: 'checkbox',
    },
  ],
  labels: {
    plural: 'Checkbox Fields',
    singular: 'Checkbox',
  },
  slug: 'checkbox',
}

const Payment = (fieldConfig: PaymentFieldConfig): Block => {
  let paymentProcessorField = null
  if (fieldConfig?.paymentProcessor) {
    paymentProcessorField = {
      name: 'paymentProcessor',
      label: 'Payment Processor',
      options: [],
      type: 'select',
      ...fieldConfig.paymentProcessor,
    }
  }

  const fields = {
    fields: [
      {
        fields: [
          {
            ...name,
            admin: {
              width: '50%',
            },
          },
          {
            ...label,
            admin: {
              width: '50%',
            },
          },
        ],
        type: 'row',
      },
      {
        fields: [
          {
            ...width,
            admin: {
              width: '50%',
            },
          },
          {
            name: 'basePrice',
            admin: {
              width: '50%',
            },
            label: 'Base Price',
            type: 'number',
          },
        ],
        type: 'row',
      },
      paymentProcessorField,
      {
        name: 'priceConditions',
        fields: [
          {
            name: 'fieldToUse',
            admin: {
              components: {
                Field: DynamicFieldSelector,
              },
            },
            type: 'text',
          },
          {
            name: 'condition',
            defaultValue: 'hasValue',
            label: 'Condition',
            options: [
              {
                label: 'Has Any Value',
                value: 'hasValue',
              },
              {
                label: 'Equals',
                value: 'equals',
              },
              {
                label: 'Does Not Equal',
                value: 'notEquals',
              },
            ],
            type: 'select',
          },
          {
            name: 'valueForCondition',
            admin: {
              condition: (_: any, { condition }: any) =>
                condition === 'equals' || condition === 'notEquals',
            },
            label: 'Value',
            type: 'text',
          },
          {
            name: 'operator',
            defaultValue: 'add',
            options: [
              {
                label: 'Add',
                value: 'add',
              },
              {
                label: 'Subtract',
                value: 'subtract',
              },
              {
                label: 'Multiply',
                value: 'multiply',
              },
              {
                label: 'Divide',
                value: 'divide',
              },
            ],
            type: 'select',
          },
          {
            name: 'valueType',
            admin: {
              width: '100%',
            },
            defaultValue: 'static',
            label: 'Value Type',
            options: [
              {
                label: 'Static Value',
                value: 'static',
              },
              {
                label: 'Value Of Field',
                value: 'valueOfField',
              },
            ],
            type: 'radio',
          },
          {
            name: 'valueForOperator',
            admin: {
              components: {
                Field: DynamicPriceSelector,
              },
            },
            label: 'Value',
            type: 'text',
          },
        ],
        label: 'Price Conditions',
        labels: {
          plural: 'Price Conditions',
          singular: 'Price Condition',
        },
        type: 'array',
      },
      required,
    ].filter(Boolean) as Field[],
    labels: {
      plural: 'Payment Fields',
      singular: 'Payment',
    },
    slug: 'payment',
  }

  return fields
}

const Message: Block = {
  fields: [
    {
      name: 'message',
      localized: true,
      type: 'richText',
    },
  ],
  labels: {
    plural: 'Message Blocks',
    singular: 'Message',
  },
  slug: 'message',
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const fields = {
  checkbox: Checkbox,
  country: Country,
  email: Email,
  message: Message,
  number: Number,
  payment: Payment,
  select: Select,
  state: State,
  text: Text,
  textarea: TextArea,
} as {
  [key: string]: ((fieldConfig?: FieldConfig | boolean) => Block) | Block
}

export default fields
