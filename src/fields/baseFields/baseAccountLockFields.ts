import { Field } from '../config/types';

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
