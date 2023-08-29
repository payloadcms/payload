import { Field } from '../../fields/config/types.js';

export default [
  {
    name: 'loginAttempts',
    type: 'number',
    hidden: true,
    defaultValue: 0,
  },
  {
    name: 'lockUntil',
    type: 'date',
    hidden: true,
  },
] as Field[];
