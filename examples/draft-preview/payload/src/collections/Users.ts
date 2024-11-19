import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      domain: process.env.COOKIE_DOMAIN,
      sameSite: 'None',
      secure: true,
    },
    tokenExpiration: 28800, // 8 hours
  },
  fields: [],
}
