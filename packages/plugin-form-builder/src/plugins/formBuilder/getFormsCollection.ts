import { CollectionConfig } from 'payload/types';
import { SanitizedOptions, isValidBlockConfig } from './types';
import fields from './fields';
import deepMerge from './deepMerge';

const getFormsCollection = (options: SanitizedOptions): CollectionConfig => deepMerge({
  slug: options?.formsOverrides?.slug || 'forms',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'emailTo',
      type: 'text',
      admin: {
        description: 'Enter a comma-separated list of email addresses that should receive a copy of this form submission.',
      },
    },
    {
      name: 'successMessage',
      type: 'richText',
      admin: {
        description: 'Enter a message to display to the user after they submit the form.',
      },
    },
    {
      name: 'redirect',
      type: 'text',
      admin: {
        description: 'Enter a URL if you\'d like to redirect the user to a URL after they submit the form.',
      },
    },
    {
      name: 'submitButtonLabel',
      type: 'text',
    },
    {
      name: 'fields',
      type: 'blocks',
      blocks: options.fields.reduce((blocks, incomingFormField) => {
        if (typeof incomingFormField === 'string') {
          return [
            ...blocks,
            fields[incomingFormField],
          ];
        }

        if (isValidBlockConfig(incomingFormField)) {
          return [
            ...blocks,
            incomingFormField,
          ];
        }

        return blocks;
      }, []),
    },
  ],
}, options.formsOverrides || {});

export default getFormsCollection;
