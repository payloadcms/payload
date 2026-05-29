import type { Block, Field, UploadCollectionSlug } from 'payload'

import type { PaymentFieldConfig } from '../../types.js'

const name: Field = {
  name: 'name',
  type: 'text',
  label: ({ t }) =>
    // @ts-expect-error - translations are not typed in plugins yet
    t('plugin-form-builder:name'),
  required: true,
}

const label: Field = {
  name: 'label',
  type: 'text',
  label: ({ t }) =>
    // @ts-expect-error - translations are not typed in plugins yet
    t('plugin-form-builder:label'),
  localized: true,
}

const required: Field = {
  name: 'required',
  type: 'checkbox',
  label: ({ t }) =>
    // @ts-expect-error - translations are not typed in plugins yet
    t('plugin-form-builder:required'),
}

const width: Field = {
  name: 'width',
  type: 'number',
  label: ({ t }) =>
    // @ts-expect-error - translations are not typed in plugins yet
    t('plugin-form-builder:fieldWidth'),
}

const placeholder: Field = {
  name: 'placeholder',
  type: 'text',
  label: ({ t }) =>
    // @ts-expect-error - translations are not typed in plugins yet
    t('plugin-form-builder:placeholder'),
}

const Radio: Block = {
  slug: 'radio',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:defaultValue'),
          localized: true,
        },
      ],
    },
    {
      name: 'options',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              admin: {
                width: '50%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:label'),
              localized: true,
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              admin: {
                width: '50%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:value'),
              required: true,
            },
          ],
        },
      ],
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:radioOptionsLabel'),
      labels: {
        plural: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:optionPlural'),
        singular: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:optionSingular'),
      },
    },
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:radioLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:radioLabelSingular'),
  },
}

const Select: Block = {
  slug: 'select',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:defaultValue'),
          localized: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          ...placeholder,
        },
      ],
    },
    {
      name: 'options',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              admin: {
                width: '50%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:label'),
              localized: true,
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              admin: {
                width: '50%',
              },
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:value'),
              required: true,
            },
          ],
        },
      ],
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:selectOptionsLabel'),
      labels: {
        plural: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:optionPlural'),
        singular: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:optionSingular'),
      },
    },
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:selectLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:selectLabelSingular'),
  },
}

const Text: Block = {
  slug: 'text',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:defaultValue'),
          localized: true,
        },
      ],
    },
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:textLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:textLabelSingular'),
  },
}

const TextArea: Block = {
  slug: 'textarea',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:defaultValue'),
          localized: true,
        },
      ],
    },
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:textareaLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:textareaLabelSingular'),
  },
}

const Number: Block = {
  slug: 'number',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
      fields: [
        {
          ...width,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'defaultValue',
          type: 'number',
          admin: {
            width: '50%',
          },
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:defaultValue'),
        },
      ],
    },
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:numberLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:numberLabelSingular'),
  },
}

const Email: Block = {
  slug: 'email',
  fields: [
    {
      type: 'row',
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
    },
    width,
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:emailLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:emailLabelSingular'),
  },
}

const State: Block = {
  slug: 'state',
  fields: [
    {
      type: 'row',
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
    },
    width,
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:stateLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:stateLabelSingular'),
  },
}

const Country: Block = {
  slug: 'country',
  fields: [
    {
      type: 'row',
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
    },
    width,
    required,
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:countryLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:countryLabelSingular'),
  },
}

const Checkbox: Block = {
  slug: 'checkbox',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
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
    },
    {
      name: 'defaultValue',
      type: 'checkbox',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:checkedByDefault'),
    },
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:checkboxLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:checkboxLabelSingular'),
  },
}

const Date: Block = {
  slug: 'date',
  fields: [
    {
      type: 'row',
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
    },
    {
      type: 'row',
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
    },
    {
      name: 'defaultValue',
      type: 'date',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:defaultValue'),
    },
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:dateLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:dateLabelSingular'),
  },
}

const Payment = (fieldConfig: PaymentFieldConfig): Block => {
  let paymentProcessorField: Field | null = null
  if (fieldConfig?.paymentProcessor) {
    paymentProcessorField = {
      name: 'paymentProcessor',
      type: 'select',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:paymentProcessorLabel'),
      options: [],
      ...fieldConfig.paymentProcessor,
    }
  }

  const fields: Block = {
    slug: 'payment',
    fields: [
      {
        type: 'row',
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
      },
      {
        type: 'row',
        fields: [
          {
            ...width,
            admin: {
              width: '50%',
            },
          },
          {
            name: 'basePrice',
            type: 'number',
            admin: {
              width: '50%',
            },
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:basePriceLabel'),
          },
        ],
      },
      ...(paymentProcessorField ? [paymentProcessorField] : []),
      {
        name: 'priceConditions',
        type: 'array',
        fields: [
          {
            name: 'fieldToUse',
            type: 'text',
            admin: {
              components: {
                Field: '@payloadcms/plugin-form-builder/client#DynamicFieldSelector',
              },
            },
          },
          {
            name: 'condition',
            type: 'select',
            defaultValue: 'hasValue',
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:conditionLabel'),
            options: [
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:hasAnyValueLabel'),
                value: 'hasValue',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:equalsLabel'),
                value: 'equals',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:doesNotEqualLabel'),
                value: 'notEquals',
              },
            ],
          },
          {
            name: 'valueForCondition',
            type: 'text',
            admin: {
              condition: (_: any, { condition }: any) =>
                condition === 'equals' || condition === 'notEquals',
            },
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:valueLabel'),
          },
          {
            name: 'operator',
            type: 'select',
            defaultValue: 'add',
            options: [
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:addLabel'),
                value: 'add',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:subtractLabel'),
                value: 'subtract',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:multiplyLabel'),
                value: 'multiply',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:divideLabel'),
                value: 'divide',
              },
            ],
          },
          {
            name: 'valueType',
            type: 'radio',
            admin: {
              width: '100%',
            },
            defaultValue: 'static',
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:valueTypeLabel'),
            options: [
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:staticValueLabel'),
                value: 'static',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:valueOfFieldLabel'),
                value: 'valueOfField',
              },
            ],
          },
          {
            name: 'valueForOperator',
            type: 'text',
            admin: {
              components: {
                Field: '@payloadcms/plugin-form-builder/client#DynamicPriceSelector',
              },
            },
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:valueLabel'),
          },
        ],
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:priceConditionsLabel'),
        labels: {
          plural: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:priceConditionsLabelPlural'),
          singular: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:priceConditionsLabelSingular'),
        },
      },
      required,
    ],
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:paymentFieldPlural'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:paymentFieldSingular'),
    },
  }

  return fields
}

const Message: Block = {
  slug: 'message',
  fields: [
    {
      name: 'message',
      type: 'richText',
      localized: true,
    },
  ],
  labels: {
    plural: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:messageLabelPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:messageLabelSingular'),
  },
}

const Upload = (uploadCollections: UploadCollectionSlug[]): Block => {
  return {
    slug: 'upload',
    fields: [
      {
        type: 'row',
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
      },
      {
        name: 'uploadCollection',
        type: 'select',
        admin: {
          description: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:uploadCollectionDescription'),
        },
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:uploadCollectionLabel'),
        options: uploadCollections.map((slug) => ({ label: slug, value: slug })),
        required: true,
      },
      {
        name: 'mimeTypes',
        type: 'array',
        admin: {
          description: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:allowedFileTypesDescription'),
        },
        fields: [
          {
            name: 'mimeType',
            type: 'text',
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:mimeTypeLabel'),
            required: true,
          },
        ],
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:allowedFileTypesLabel'),
        labels: {
          plural: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:mimeTypePlural'),
          singular: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:mimeTypeSingular'),
        },
      },
      {
        type: 'row',
        fields: [
          {
            ...width,
            admin: {
              width: '50%',
            },
          },
          {
            name: 'maxFileSize',
            type: 'number',
            admin: {
              description: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-form-builder:maxFileSizeDescription'),
              width: '50%',
            },
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:maxFileSizeLabel'),
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            ...required,
            admin: {
              width: '50%',
            },
          },
          {
            name: 'multiple',
            type: 'checkbox',
            admin: {
              width: '50%',
            },
            label: ({ t }) =>
              // @ts-expect-error - translations are not typed in plugins yet
              t('plugin-form-builder:allowMultipleFilesLabel'),
          },
        ],
      },
    ],
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:uploadFieldPlural'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-form-builder:uploadFieldSingular'),
    },
  }
}

export const fields: {
  [key: string]: ((arg?: any) => Block) | Block
} = {
  checkbox: Checkbox,
  country: Country,
  date: Date,
  email: Email,
  message: Message,
  number: Number,
  payment: Payment,
  radio: Radio,
  select: Select,
  state: State,
  text: Text,
  textarea: TextArea,
  upload: Upload,
}
