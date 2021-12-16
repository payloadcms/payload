import { CollectionConfig } from 'payload/types';
import { SanitizedOptions } from './types';
import deepMerge from './deepMerge';
import sendEmail from './sendEmail';

const getFormSubmissionsCollection = (options: SanitizedOptions): CollectionConfig => deepMerge({
  slug: options?.formsOverrides?.slug || 'formSubmissions',
  access: {
    create: () => true,
    update: () => false,
  },
  admin: {
    enableRichTextRelationship: false
  },
  hooks: {
    beforeChange: [
      (data) => sendEmail(data, options),
    ],
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
    },
    {
      name: 'submissionData',
      type: 'array',
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
  ],
}, options.formSubmissionsOverrides || {});

export default getFormSubmissionsCollection;
