import { Field } from 'payload/types';
import richText from './richText';

export const hero: Field = {
  name: 'hero',
  label: false,
  type: 'group',
  fields: [
    richText({
      admin: {
        elements: [
          'h1',
        ],
        leaves: [],
      },
    }),
  ],
};
