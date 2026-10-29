import type { Config } from 'payload'

/**
 * Copies the config containers multi-tenant modifies. Opaque values such as custom data,
 * component props, runtime adapters and callbacks retain their original references.
 */
export const copyConfig = ({ config }: { config: Config }): Config => ({
  ...config,
  admin: config.admin && {
    ...config.admin,
    components: config.admin.components && {
      ...config.admin.components,
      actions: config.admin.components.actions && [...config.admin.components.actions],
      beforeNav: config.admin.components.beforeNav && [...config.admin.components.beforeNav],
      providers: config.admin.components.providers && [...config.admin.components.providers],
    },
  },
  baseAccess: config.baseAccess && {
    ...config.baseAccess,
    collections: config.baseAccess.collections && { ...config.baseAccess.collections },
  },
  blocks: config.blocks?.map((block) => ({ ...block })),
  collections: config.collections?.map((collection) => ({
    ...collection,
    access: collection.access && { ...collection.access },
    admin: collection.admin && {
      ...collection.admin,
      components: collection.admin.components && {
        ...collection.admin.components,
        edit: collection.admin.components.edit && {
          ...collection.admin.components.edit,
          editMenuItems: collection.admin.components.edit.editMenuItems && [
            ...collection.admin.components.edit.editMenuItems,
          ],
        },
      },
    },
    fields: [...collection.fields],
    hooks: collection.hooks && {
      ...collection.hooks,
      afterDelete: collection.hooks.afterDelete && [...collection.hooks.afterDelete],
      beforeValidate: collection.hooks.beforeValidate && [...collection.hooks.beforeValidate],
    },
  })),
  i18n: config.i18n && {
    ...config.i18n,
    translations:
      config.i18n.translations &&
      Object.fromEntries(
        Object.entries(config.i18n.translations).map(([locale, translations]) => [
          locale,
          { ...translations },
        ]),
      ),
  },
})
