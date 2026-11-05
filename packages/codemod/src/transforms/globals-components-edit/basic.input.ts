import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    components: {
      elements: {
        beforeDocumentControls: ['/components/CustomBefore.js#CustomBefore'],
        Description: '/components/CustomDescription.js#CustomDescription',
        SaveButton: '/components/CustomSave.js#CustomSave',
        Status: '/components/CustomStatus.js#CustomStatus',
      },
    },
  },
  fields: [{ name: 'title', type: 'text' }],
}
