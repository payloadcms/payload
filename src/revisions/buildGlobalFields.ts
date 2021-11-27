import { Field } from '../fields/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

export const buildRevisionGlobalFields = (global: SanitizedGlobalConfig): Field[] => [
  {
    name: 'revision',
    type: 'group',
    fields: global.fields,
  },
];
