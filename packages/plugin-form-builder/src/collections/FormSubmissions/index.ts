import type { CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../../types'

import createCharge from './hooks/createCharge'
import sendEmail from './hooks/sendEmail'

// all settings can be overridden by the config
export const generateSubmissionCollection = (formConfig: PluginConfig): CollectionConfig => {
  const formSlug = formConfig?.formOverrides?.slug || 'forms'

  const newConfig: CollectionConfig = {
    ...(formConfig?.formSubmissionOverrides || {}),
    access: {
      create: () => true,
      read: ({ req: { user } }) => !!user, // logged-in users,
      update: () => false,
      ...(formConfig?.formSubmissionOverrides?.access || {}),
    },
    admin: {
      ...(formConfig?.formSubmissionOverrides?.admin || {}),
      enableRichTextRelationship: false,
    },
    fields: [
      {
        name: 'form',
        admin: {
          readOnly: true,
        },
        relationTo: formSlug,
        required: true,
        type: 'relationship',
        validate: async (value, { payload }) => {
          /* Don't run in the client side */
          if (!payload) return true

          if (payload) {
            let existingForm

            try {
              existingForm = await payload.findByID({
                id: value,
                collection: formSlug,
              })

              return true
            } catch (error) {
              return 'Cannot create this submission because this form does not exist.'
            }
          }
        },
      },
      {
        name: 'submissionData',
        admin: {
          readOnly: true,
        },
        fields: [
          {
            name: 'field',
            required: true,
            type: 'text',
          },
          {
            name: 'value',
            required: true,
            type: 'text',
            validate: (value: unknown) => {
              // TODO:
              // create a validation function that dynamically
              // relies on the field type and its options as configured.

              // How to access sibling data from this field?
              // Need the `name` of the field in order to validate it.

              // Might not be possible to use this validation function.
              // Instead, might need to do all validation in a `beforeValidate` collection hook.

              if (typeof value !== 'undefined') {
                return true
              }

              return 'This field is required.'
            },
          },
        ],
        type: 'array',
      },
      ...(formConfig?.formSubmissionOverrides?.fields || []),
    ],
    hooks: {
      beforeChange: [
        (data) => createCharge(data, formConfig),
        (data) => sendEmail(data, formConfig),
        ...(formConfig?.formSubmissionOverrides?.hooks?.beforeChange || []),
      ],
      ...(formConfig?.formSubmissionOverrides?.hooks || {}),
    },
    slug: formConfig?.formSubmissionOverrides?.slug || 'form-submissions',
  }

  const paymentFieldConfig = formConfig?.fields?.payment

  if (paymentFieldConfig) {
    newConfig.fields.push({
      name: 'payment',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'field',
          label: 'Field',
          type: 'text',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'text',
        },
        {
          name: 'amount',
          admin: {
            description: 'Amount in cents',
          },
          type: 'number',
        },
        {
          name: 'paymentProcessor',
          type: 'text',
        },
        {
          name: 'creditCard',
          fields: [
            {
              name: 'token',
              label: 'token',
              type: 'text',
            },
            {
              name: 'brand',
              label: 'Brand',
              type: 'text',
            },
            {
              name: 'number',
              label: 'Number',
              type: 'text',
            },
          ],
          label: 'Credit Card',
          type: 'group',
        },
      ],
      type: 'group',
    })
  }

  return newConfig
}
