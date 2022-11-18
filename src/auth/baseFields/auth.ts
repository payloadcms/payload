import { email } from '../../fields/validations';
import { Field } from '../../fields/config/types';
import { extractTranslations } from '../../translations/extractTranslations';

const labels = extractTranslations(['general:email']);

export default [
  {
    name: 'email',
    label: labels['general:email'],
    type: 'email',
    validate: email,
    unique: true,
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
] as Field[];
