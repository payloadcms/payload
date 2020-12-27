import { PayloadCollectionConfig } from '../../src/collections/config/types';

const AutoLabel: PayloadCollectionConfig = {
  slug: 'auto-label',
  fields: [{
    name: 'text',
    type: 'text',
    label: 'Text',
  }],
};

export default AutoLabel;
