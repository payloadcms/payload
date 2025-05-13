import type { GlobalConfig } from 'payload'

export const adminSlug = 'admin'

export const AdminGlobal: GlobalConfig = {
  slug: adminSlug,
  lockDocuments: {
    duration: 10,
  },
  fields: [
    {
      name: 'adminText',
      type: 'text',
    },
  ],
}
