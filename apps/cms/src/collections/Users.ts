import type { CollectionConfig } from 'payload'

import { twoFactorEndpoints } from '../twoFactor/endpoints'
import { twoFactorFields } from '../twoFactor/fields'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      // Only send the auth cookie over HTTPS once the site is served over HTTPS
      secure: process.env.SERVER_URL?.startsWith('https://') ?? false,
    },
    lockTime: 10 * 60 * 1000,
    maxLoginAttempts: 5,
  },
  // Two-factor authentication (src/twoFactor, enforced by src/proxy.ts)
  endpoints: twoFactorEndpoints,
  fields: [
    // Email added by default
    ...twoFactorFields,
  ],
}
