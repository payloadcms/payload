import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    components: {
      Description: '/components/CustomDescription.js#CustomDescription',
      edit: {
        beforeDocumentControls: ['/components/CustomBefore.js#CustomBefore'],
        SaveButton: '/components/CustomSave.js#CustomSave',
        Status: '/components/CustomStatus.js#CustomStatus',
      },
    },
  },
  fields: [{ name: 'title', type: 'text' }],
}
