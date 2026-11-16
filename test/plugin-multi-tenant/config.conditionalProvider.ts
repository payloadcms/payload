/* eslint-disable no-restricted-exports */

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { baseConfig, seed } from './config.base.js'

/**
 * Extends the base multi-tenant config with a ConditionalWrapperProvider
 * that changes its tree structure on auth (Context.Provider → Fragment).
 * This causes React to remount the TenantSelectionProviderClient subtree,
 * exercising the RSC prop sync fix.
 */
export default buildConfigWithDefaults({
  suite: 'plugin-multi-tenant-conditional-provider',
  config: {
    ...baseConfig,
    admin: {
      ...baseConfig.admin,
      components: {
        ...baseConfig.admin?.components,
        providers: ['/components/ConditionalWrapperProvider/index.js#ConditionalWrapperProvider'],
      },
    },
  },
  seed,
})
