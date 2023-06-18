/* eslint-disable no-param-reassign */
import payload from '../../../../src';
import { CollectionConfig } from '../../../../src/collections/config/types';

export const contextHooksSlug = 'context-hooks';
const ContextHooks: CollectionConfig = {
  slug: contextHooksSlug,
  access: {
    read: () => true,
    create: () => true,
    delete: () => true,
    update: () => true,
  },
  hooks: {
    beforeChange: [({ context, data, req }) => {
      context.secretValue = 'secret';
      if (req.payloadContext !== context) {
        throw new Error('req.payloadContext !== context');
      }
      return data;
    }],
    afterChange: [async ({ context, doc }) => {
      if (context.triggerAfterChange === false) { // Make sure we don't trigger afterChange again and again in an infinite loop
        return;
      }
      await payload.update({
        collection: contextHooksSlug,
        id: doc.id,
        data: {
          value: context.secretValue ?? '',
        },
        context: {
          triggerAfterChange: false, // Make sure we don't trigger afterChange again and again in an infinite loop. This should be done via context and not a potential disableHooks property, as we want to specifically test the context functionality here
        },
      });
    }],
  },
  fields: [
    {
      name: 'value',
      type: 'text',
    },
  ],
};

export default ContextHooks;
