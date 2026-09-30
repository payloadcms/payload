import type { CollectionConfig } from 'payload'

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
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
