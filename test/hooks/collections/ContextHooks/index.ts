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
    beforeChange: [(props) => {
      props.req.payloadContext.secretValue = 'secret';
      return props.data;
    }],
    afterChange: [async (props) => {
      if (props.req.payloadContext.triggerAfterChange === false) { // Make sure we don't trigger afterChange again and again in an infinite loop
        return;
      }
      await payload.update({
        collection: contextHooksSlug,
        id: props.doc.id,
        data: {
          value: props.req.payloadContext.secretValue ?? '',
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
