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
        t('plugin-form-builder:radioOptions'),
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
      t('plugin-form-builder:radioPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:radioSingular'),
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
        t('plugin-form-builder:selectOptions'),
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
      t('plugin-form-builder:selectPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:selectSingular'),
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
      t('plugin-form-builder:textPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:textSingular'),
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
      t('plugin-form-builder:textareaPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:textareaSingular'),
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
      t('plugin-form-builder:numberPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:numberSingular'),
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
      t('plugin-form-builder:emailPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:emailSingular'),
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
      t('plugin-form-builder:statePlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:stateSingular'),
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
      t('plugin-form-builder:countryPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:countrySingular'),
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
      t('plugin-form-builder:checkboxPlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:checkboxSingular'),
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
      t('plugin-form-builder:datePlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:dateSingular'),
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
        t('plugin-form-builder:paymentProcessor'),
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
              t('plugin-form-builder:basePrice'),
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
              t('plugin-form-builder:condition'),
            options: [
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:hasAnyValue'),
                value: 'hasValue',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:equals'),
                value: 'equals',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:doesNotEqual'),
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
              t('plugin-form-builder:value'),
          },
          {
            name: 'operator',
            type: 'select',
            defaultValue: 'add',
            options: [
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:add'),
                value: 'add',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:subtract'),
                value: 'subtract',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:multiply'),
                value: 'multiply',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:divide'),
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
              t('plugin-form-builder:valueType'),
            options: [
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:staticValue'),
                value: 'static',
              },
              {
                label: ({ t }) =>
                  // @ts-expect-error - translations are not typed in plugins yet
                  t('plugin-form-builder:valueOfField'),
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
              t('plugin-form-builder:value'),
          },
        ],
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:priceConditions'),
        labels: {
          plural: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:priceConditionsPlural'),
          singular: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-form-builder:priceConditionsSingular'),
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
      t('plugin-form-builder:messagePlural'),
    singular: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-form-builder:messageSingular'),
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
          t('plugin-form-builder:uploadCollection'),
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
              t('plugin-form-builder:mimeType'),
            required: true,
          },
        ],
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-form-builder:allowedFileTypes'),
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
              t('plugin-form-builder:maxFileSize'),
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
              t('plugin-form-builder:allowMultipleFiles'),
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
