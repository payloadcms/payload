import { PayloadCollectionConfig } from '../../src/collections/config/types';

const AutoLabel: PayloadCollectionConfig = {
  slug: 'auto-label',
  fields: [{
    name: 'autoLabelField',
    type: 'text',
  },
  {
    name: 'noLabel',
    type: 'text',
    label: false,
  },
  {
    name: 'labelOverride',
    type: 'text',
    label: 'Custom Label',
  }],
};

export default AutoLabel;
