import type { CollectionSlug, Plugin } from 'payload'

import type { HookPerfTestingConfig } from './types.js'

import { wrapHooksArray } from './utils.js'

export const hookPerfTestingPlugin =
  (pluginConfig?: HookPerfTestingConfig): Plugin =>
  (config) => {
    // Early exit if disabled
    if (pluginConfig && pluginConfig.enabled === false) {
      return config
    }

    const enabledCollections = pluginConfig && pluginConfig.collections
    const instrumentAllCollections = !enabledCollections || enabledCollections.length === 0

    // Modify collections to inject hooks
    const collectionsWithHooks = (config.collections || []).map((collection) => {
      // Check if this collection should be instrumented
      if (
        !instrumentAllCollections &&
        !enabledCollections.includes(collection.slug as CollectionSlug)
      ) {
        return collection
      }

      const existingHooks = collection.hooks || {}
      const slug = collection.slug

      return {
        ...collection,
        hooks: {
          ...existingHooks,
          // Lifecycle hooks - wrap existing hooks with timers
          afterChange: wrapHooksArray('afterChange', existingHooks.afterChange, slug),
          afterDelete: wrapHooksArray('afterDelete', existingHooks.afterDelete, slug),
          afterRead: wrapHooksArray('afterRead', existingHooks.afterRead, slug),
          beforeChange: wrapHooksArray('beforeChange', existingHooks.beforeChange, slug),
          beforeDelete: wrapHooksArray('beforeDelete', existingHooks.beforeDelete, slug),
          beforeRead: wrapHooksArray('beforeRead', existingHooks.beforeRead, slug),
          beforeValidate: wrapHooksArray('beforeValidate', existingHooks.beforeValidate, slug),
          // Operation-wide hooks
          afterOperation: wrapHooksArray('afterOperation', existingHooks.afterOperation, slug),
          beforeOperation: wrapHooksArray('beforeOperation', existingHooks.beforeOperation, slug),
          // Auth hooks (if auth is enabled on the collection)
          afterForgotPassword: wrapHooksArray(
            'afterForgotPassword',
            existingHooks.afterForgotPassword,
            slug,
          ),
          afterLogin: wrapHooksArray('afterLogin', existingHooks.afterLogin, slug),
          afterLogout: wrapHooksArray('afterLogout', existingHooks.afterLogout, slug),
          afterMe: wrapHooksArray('afterMe', existingHooks.afterMe, slug),
          afterRefresh: wrapHooksArray('afterRefresh', existingHooks.afterRefresh, slug),
          beforeLogin: wrapHooksArray('beforeLogin', existingHooks.beforeLogin, slug),
          // Error hook
          afterError: wrapHooksArray('afterError', existingHooks.afterError, slug),
        },
      }
    })

    return {
      ...config,
      collections: collectionsWithHooks,
    }
  }
