import { CollectionConfig } from 'payload/types';
import { FormConfig } from '../../types';
import deepMerge from '../../utilities/deepMerge';
import sendEmail from './hooks/sendEmail';
import createCharge from './hooks/createCharge';

// all settings can be overridden by the config
export const generateSubmissionCollection = (formConfig: FormConfig): CollectionConfig => deepMerge({
  slug: formConfig?.formSubmissionOverrides?.slug || 'formSubmissions',
  access: {
    create: () => true,
    update: () => false,
    read: ({ req: { user } }) => !!user // logged-in users
  },
  admin: {
    enableRichTextRelationship: false
  },
  hooks: {
    beforeChange: [
      (data) => createCharge(data, formConfig),
      (data) => sendEmail(data, formConfig),
    ],
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        readOnly: true
      },
    },
    {
      name: 'submissionData',
      type: 'array',
      admin: {
        readOnly: true
      },
      fields: [
        {
          name: 'field',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          validate: (value: unknown) => {
            // TODO:
            // create a validation function that dynamically
            // relies on the field type and its options as configured.

            // How to access sibling data from this field?
            // Need the `name` of the field in order to validate it.

            // Might not be possible to use this validation function.
            // Instead, might need to do all validation in a `beforeValidate` collection hook.

            if (typeof value !== 'undefined') {
              return true;
            }

            return 'This field is required.';
          },
        },
      ],
    },
    {
      name: 'payments',
      type: 'array',
      admin: {
        readOnly: true
      },
      fields: [
        {
          name: 'field',
          label: 'Field',
          type: 'text'
        },
        {
          name: 'status',
          label: 'Status',
          type: 'text'
        },
        {
          name: 'amount',
          type: 'number'
        },
        {
          name: 'amount',
          type: 'number'
        },
        {
          name: 'paymentProcessor',
          type: 'select',
          options: [
            {
              label: 'Stripe',
              value: 'stripe'
            }
          ]
        },
        {
          name: 'creditCard',
          label: 'Credit Card',
          type: 'group',
          fields: [
            {
              name: 'token',
              label: 'token',
              type: 'text'
            },
            {
              name: 'brand',
              label: 'Brand',
              type: 'text'
            },
            {
              name: 'number',
              label: 'Number',
              type: 'text'
            }
          ]
        }
      ]
    }
  ],
}, formConfig.formSubmissionOverrides || {});
