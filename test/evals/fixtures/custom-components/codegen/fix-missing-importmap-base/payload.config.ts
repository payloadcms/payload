import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

// admin.importMap.baseDir is missing — component paths will resolve from the
// project root instead of src/, causing "component not found" errors in prod.
export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ['/components/AnnouncementBanner'],
      graphics: {
        Logo: '/components/BrandLogo',
      },
    },
  },
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
  db: stubAdapter,
  secret: 'eval-fixture',
})
