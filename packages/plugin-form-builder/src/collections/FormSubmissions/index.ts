import type { CollectionConfig } from 'payload/types'

import type { PluginConfig } from '../../types'

import createCharge from './hooks/createCharge'
import sendEmail from './hooks/sendEmail'

// all settings can be overridden by the config
export const generateSubmissionCollection = (formConfig: PluginConfig): CollectionConfig => {
  const formSlug = formConfig?.formOverrides?.slug || 'forms'

  const newConfig: CollectionConfig = {
    ...(formConfig?.formSubmissionOverrides || {}),
    slug: formConfig?.formSubmissionOverrides?.slug || 'form-submissions',
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
        type: 'relationship',
        admin: {
          readOnly: true,
        },
        relationTo: formSlug,
        required: true,
        validate: async (value, { payload, req }) => {
          /* Don't run in the client side */
          if (!payload) return true

          if (payload) {
            let existingForm

            try {
              existingForm = await payload.findByID({
                id: value,
                collection: formSlug,
                req,
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
        type: 'array',
        admin: {
          readOnly: true,
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
                return true
              }

              return 'This field is required.'
            },
          },
        ],
      },
      ...(formConfig?.formSubmissionOverrides?.fields || []),
    ],
    hooks: {
      ...(formConfig?.formSubmissionOverrides?.hooks || {}),
      beforeChange: [
        (data) => createCharge(data, formConfig),
        (data) => sendEmail(data, formConfig),
        ...(formConfig?.formSubmissionOverrides?.hooks?.beforeChange || []),
      ],
    },
  }

  const paymentFieldConfig = formConfig?.fields?.payment

  if (paymentFieldConfig) {
    newConfig.fields.push({
      name: 'payment',
      type: 'group',
      admin: {
        readOnly: true,
      },
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
    })
  }

  return newConfig
}
