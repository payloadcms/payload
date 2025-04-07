import type { CollectionConfig, Field } from 'payload'

import type { FormBuilderPluginConfig } from '../../types.js'

import { defaultPaymentFields } from './fields/defaultPaymentFields.js'
import { createCharge } from './hooks/createCharge.js'
import { sendEmail } from './hooks/sendEmail.js'

// all settings can be overridden by the config
export const generateSubmissionCollection = (
  formConfig: FormBuilderPluginConfig,
): CollectionConfig => {
  const formSlug = formConfig?.formOverrides?.slug || 'forms'

  const enablePaymentFields = Boolean(formConfig?.fields?.payment)

  const defaultFields: Field[] = [
    {
      name: 'form',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: formSlug,
      required: true,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      validate: async (value, { req: { payload }, req }) => {
        /* Don't run in the client side */
        if (!payload) {
          return true
        }

        if (payload) {
          let _existingForm

          try {
            _existingForm = await payload.findByID({
              id: value,
              collection: formSlug,
              req,
            })

            return true
          } catch (_error) {
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
    ...(enablePaymentFields ? [defaultPaymentFields] : []),
  ]

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
    fields:
      formConfig?.formSubmissionOverrides?.fields &&
      typeof formConfig?.formSubmissionOverrides?.fields === 'function'
        ? formConfig.formSubmissionOverrides.fields({ defaultFields })
        : defaultFields,
    hooks: {
      ...(formConfig?.formSubmissionOverrides?.hooks || {}),
      beforeChange: [
        (data) => createCharge(data, formConfig),
        (data) => sendEmail(data, formConfig),
        ...(formConfig?.formSubmissionOverrides?.hooks?.beforeChange || []),
      ],
    },
  }
  return newConfig
}
