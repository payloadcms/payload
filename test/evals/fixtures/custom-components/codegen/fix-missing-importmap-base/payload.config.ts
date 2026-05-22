import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// admin.importMap.baseDir is missing — component paths will resolve from the
// project root instead of src/, causing "component not found" errors in prod.
export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  admin: {
    components: {
      beforeDashboard: ['/components/AnnouncementBanner'],
      graphics: {
        Logo: '/components/BrandLogo',
      },
    },
  },
})
