import { getTranslation } from '@payloadcms/translations';
/**
 * @deprecated Import from `payload` instead
 */
export var EntityType = /*#__PURE__*/function (EntityType) {
  EntityType["collection"] = "collections";
  EntityType["global"] = "globals";
  return EntityType;
}({});
export function groupNavItems(entities, permissions, i18n) {
  const result = entities.reduce((groups, entityToGroup) => {
    // Skip entities where admin.group is explicitly false
    if (entityToGroup.entity?.admin?.group === false) {
      return groups;
    }
    if (permissions?.[entityToGroup.type.toLowerCase()]?.[entityToGroup.entity.slug]?.read) {
      const translatedGroup = getTranslation(entityToGroup.entity.admin.group, i18n);
      const labelOrFunction = 'labels' in entityToGroup.entity ? entityToGroup.entity.labels.plural : entityToGroup.entity.label;
      const label = typeof labelOrFunction === 'function' ? labelOrFunction({
        i18n,
        t: i18n.t
      }) : labelOrFunction;
      if (entityToGroup.entity.admin.group) {
        const existingGroup = groups.find(group => getTranslation(group.label, i18n) === translatedGroup);
        let matchedGroup = existingGroup;
        if (!existingGroup) {
          matchedGroup = {
            entities: [],
            label: translatedGroup
          };
          groups.push(matchedGroup);
        }
        matchedGroup.entities.push({
          slug: entityToGroup.entity.slug,
          type: entityToGroup.type,
          label
        });
      } else {
        const defaultGroup = groups.find(group => {
          return getTranslation(group.label, i18n) === i18n.t(`general:${entityToGroup.type}`);
        });
        defaultGroup.entities.push({
          slug: entityToGroup.entity.slug,
          type: entityToGroup.type,
          label
        });
      }
    }
    return groups;
  }, [{
    entities: [],
    label: i18n.t('general:collections')
  }, {
    entities: [],
    label: i18n.t('general:globals')
  }]);
  return result.filter(group => group.entities.length > 0);
}
//# sourceMappingURL=groupNavItems.js.map