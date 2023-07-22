import crypto from 'crypto';
import { Field, FieldHook } from '../../fields/config/types';
import { extractTranslations } from '../../translations/extractTranslations';

const labels = extractTranslations(['authentication:enableAPIKey', 'authentication:apiKey']);

const encryptKey: FieldHook = ({ req, value }) => (value ? req.payload.encrypt(value as string) : undefined);
const decryptKey: FieldHook = ({ req, value }) => (value ? req.payload.decrypt(value as string) : undefined);

export default [
  {
    name: 'enableAPIKey',
    label: labels['authentication:enableAPIKey'],
    type: 'checkbox',
    defaultValue: false,
    admin: {
      components: {
        Field: () => null,
      },
    },
  },
  {
    name: 'apiKey',
    label: labels['authentication:apiKey'],
    type: 'text',
    admin: {
      components: {
        Field: () => null,
      },
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
              .update(data.apiKey as string)
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
