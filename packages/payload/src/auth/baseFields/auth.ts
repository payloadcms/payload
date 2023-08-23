import { email } from '../../fields/validations';
import { Field } from '../../fields/config/types';
import { extractTranslations } from '../../translations/extractTranslations';

const labels = extractTranslations(['general:email']);

const baseAuthFields: Field[] = [
  {
    name: 'email',
    label: labels['general:email'],
    type: 'email',
    validate: email,
    unique: true,
    required: true,
    admin: {
      components: {
        Field: () => null,
      },
    },
  },
  {
    name: 'resetPasswordToken',
    type: 'text',
    hidden: true,
  },
  {
    name: 'resetPasswordExpiration',
    type: 'date',
    hidden: true,
  },
  {
    name: 'salt',
    type: 'text',
    hidden: true,
  },
  {
    name: 'hash',
    type: 'text',
    hidden: true,
  },
];

export default baseAuthFields;
