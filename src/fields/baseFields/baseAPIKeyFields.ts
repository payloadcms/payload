import crypto from 'crypto';
import { Field, FieldHook } from '../config/types';

const encryptKey: FieldHook = ({ req, value }) => (value ? req.payload.encrypt(value) : undefined);
const decryptKey: FieldHook = ({ req, value }) => (value ? req.payload.decrypt(value) : undefined);

export default [
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      disabled: true,
    },
  },
  {
    name: 'apiKey',
    type: 'text',
    admin: {
      disabled: true,
    },
    hooks: {
      beforeChange: [
        encryptKey,
      ],
      afterRead: [
        decryptKey,
      ],
    },
  },
  {
    name: 'apiKeyIndex',
    type: 'text',
    hidden: true,
    admin: {
      disabled: true,
    },
    hooks: {
      beforeValidate: [
        async ({ data, req, value }) => {
          if (data.apiKey) {
            return crypto.createHmac('sha1', req.payload.secret)
              .update(data.apiKey)
              .digest('hex');
          }
          if (data.enableAPIKey === false) {
            return null;
          }
          return value;
        },
      ],
    },
  },
] as Field[];
