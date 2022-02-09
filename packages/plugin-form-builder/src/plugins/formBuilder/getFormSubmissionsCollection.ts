import { CollectionConfig } from 'payload/types';
import { SanitizedOptions } from './types';
import deepMerge from './deepMerge';
import sendEmail from './hooks/sendEmail';
import createCharge from './hooks/createCharge';
import loggedInUsers from '../../collections/User/access/loggedInUsers';

const getFormSubmissionsCollection = (options: SanitizedOptions): CollectionConfig => deepMerge({
  slug: options?.formsOverrides?.slug || 'formSubmissions',
  access: {
    create: () => true,
    update: () => false,
    read: loggedInUsers
  },
  admin: {
    enableRichTextRelationship: false
  },
  hooks: {
    beforeChange: [
      createCharge,
      (data) => sendEmail(data, options),
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
}, options.formSubmissionsOverrides || {});

export default getFormSubmissionsCollection;
