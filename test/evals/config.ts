import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { evalReportHandler } from './evalReportHandler.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  endpoints: [
    {
      // Serves eval-results/ static files so the Vitest HTML report's assets resolve correctly.
      // Accessible at /api/eval-report/<filepath>
      handler: evalReportHandler,
      method: 'get',
      path: '/eval-report/:filepath(.*)',
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['/components/EvalDashboard/NavLink.js#EvalDashboardNavLink'],
      beforeDashboard: ['/components/DashboardInfo/index.js#DashboardInfo'],
      views: {
        evalDashboard: {
          Component: '/components/EvalDashboard/index.js#EvalDashboardView',
          path: '/eval-dashboard',
        },
      },
    },
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
