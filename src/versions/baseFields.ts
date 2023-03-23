import { Field } from '../fields/config/types';
import { extractTranslations } from '../translations/extractTranslations';

const labels = extractTranslations(['version:draft', 'version:published', 'version:status']);

export const statuses = [
  {
    label: labels['version:draft'],
    value: 'draft',
  },
  {
    label: labels['version:published'],
    value: 'published',
  },
];

const baseVersionFields: Field[] = [
  {
    name: '_status',
    label: labels['version:status'],
    type: 'select',
    options: statuses,
    defaultValue: 'draft',
    admin: {
      disableBulkEdit: true,
      components: {
        Field: () => null,
      },
    },
  },
];

export default baseVersionFields;
