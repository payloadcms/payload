import { Field, FieldHook } from '../config/types';

const autoRemoveVerificationToken: FieldHook = ({ originalDoc, data, value }) => {
  // If a user manually sets `_verified` to true,
  // and it was `false`, set _verificationToken to `null`.
  // This is useful because the admin panel
  // allows users to set `_verified` to true manually
  if (data?._verified === true && originalDoc?._verified === false) {
    return null;
  }

  return value;
};

export default [
  {
    name: '_verified',
    type: 'checkbox',
    access: {
      create: () => false,
      update: ({ req: { user } }) => Boolean(user),
      read: ({ req: { user } }) => Boolean(user),
    },
    admin: {
      disabled: true,
    },
  },
  {
    name: '_verificationToken',
    type: 'text',
    hidden: true,
    hooks: {
      beforeChange: [
        autoRemoveVerificationToken,
      ],
    },
  },
] as Field[];
