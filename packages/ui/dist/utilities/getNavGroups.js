import { EntityType } from './groupNavItems.js';
import { groupNavItems } from './groupNavItems.js';
/** @internal */
export function getNavGroups(permissions, visibleEntities, config, i18n) {
  const collections = config.collections.filter(collection => permissions?.collections?.[collection.slug]?.read && visibleEntities.collections.includes(collection.slug));
  const globals = config.globals.filter(global => permissions?.globals?.[global.slug]?.read && visibleEntities.globals.includes(global.slug));
  const navGroups = groupNavItems([...(collections.map(collection => {
    const entityToGroup = {
      type: EntityType.collection,
      entity: collection
    };
    return entityToGroup;
  }) ?? []), ...(globals.map(global => {
    const entityToGroup = {
      type: EntityType.global,
      entity: global
    };
    return entityToGroup;
  }) ?? [])], permissions, i18n);
  return navGroups;
}
//# sourceMappingURL=getNavGroups.js.map