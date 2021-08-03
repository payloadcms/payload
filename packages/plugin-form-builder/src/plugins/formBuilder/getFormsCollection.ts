import { CollectionConfig } from 'payload/types';
import { SanitizedOptions, isValidBlockConfig } from './types';
import fields from './fields';
import deepMerge from './deepMerge';

const getFormsCollection = (options: SanitizedOptions): CollectionConfig => deepMerge({
  slug: options?.formsOverrides?.slug || 'forms',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
