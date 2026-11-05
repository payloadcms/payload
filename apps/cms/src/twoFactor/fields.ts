import type { Field } from 'payload'

/** Server-only state: never readable or writable through the REST/GraphQL API or the admin panel */
const internalField = (field: Field): Field =>
  ({
    ...field,
    access: {
      create: () => false,
      read: () => false,
      update: () => false,
    },
    admin: {
      disableBulkEdit: true,
      disableListColumn: true,
      disableListFilter: true,
      hidden: true,
    },
  }) as Field

/** Fields the two-factor endpoints (./endpoints.ts) keep on each user */
export const twoFactorFields: Field[] = [
  {
    name: 'twoFactorEnabled',
    type: 'checkbox',
    access: {
      create: () => false,
      update: () => false,
    },
    admin: {
      description:
        'Set up at the first login. To move to a new phone, use "Reset two-factor" on /admin/2fa.',
      position: 'sidebar',
      readOnly: true,
    },
    defaultValue: false,
    label: 'Two-factor authentication',
  },
  // The authenticator secret, encrypted with PAYLOAD_SECRET
  internalField({ name: 'twoFactorSecret', type: 'text' }),
  // A secret shown during setup that becomes active once a code from it is entered
  internalField({ name: 'twoFactorPendingSecret', type: 'text' }),
  // SHA-256 hashes of the unused backup codes
  internalField({ name: 'twoFactorBackupCodes', type: 'json' }),
  // The time step of the last accepted code, so a code can't be used twice
  internalField({ name: 'twoFactorLastStep', type: 'number' }),
  internalField({ name: 'twoFactorFailedAttempts', type: 'number' }),
  internalField({ name: 'twoFactorLockUntil', type: 'date' }),
]
