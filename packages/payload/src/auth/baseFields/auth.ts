import type { Field } from '../../fields/config/types';

import { email } from '../../fields/validations';
import { extractTranslations } from '../../translations/extractTranslations';

const labels = extractTranslations(['general:email']);

const baseAuthFields: Field[] = [
  {
    admin: {
      components: {
        Field: () => null,
      },
    },
    label: labels['general:email'],
    name: 'email',
    required: true,
    type: 'email',
    unique: true,
    validate: email,
  },
  {
    hidden: true,
    name: 'resetPasswordToken',
    type: 'text',
  },
  {
    hidden: true,
    name: 'resetPasswordExpiration',
    type: 'date',
  },
  {
    hidden: true,
    name: 'salt',
    type: 'text',
  },
  {
    hidden: true,
    name: 'hash',
    type: 'text',
  },
];

export default baseAuthFields;
