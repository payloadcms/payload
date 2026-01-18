'use client';

import { deepMerge } from 'payload/shared';
export const sanitizeClientFeatures = features => {
  const sanitized = {
    enabledFeatures: [],
    enabledFormats: [],
    markdownTransformers: [],
    nodes: [],
    plugins: [],
    providers: [],
    slashMenu: {
      dynamicGroups: [],
      groups: []
    },
    toolbarFixed: {
      groups: []
    },
    toolbarInline: {
      groups: []
    }
  };
  // Allow customization of groups for toolbarFixed
  let customGroups = {};
  features.forEach(feature => {
    if (feature.key === 'toolbarFixed' && feature.sanitizedClientFeatureProps?.customGroups) {
      customGroups = {
        ...customGroups,
        ...feature.sanitizedClientFeatureProps.customGroups
      };
    }
  });
  if (!features?.size) {
    return sanitized;
  }
  features.forEach(feature => {
    if (feature.providers?.length) {
      sanitized.providers = sanitized.providers.concat(feature.providers);
    }
    if (feature.enableFormats?.length) {
      sanitized.enabledFormats.push(...feature.enableFormats);
    }
    if (feature.nodes?.length) {
      // Important: do not use concat
      for (const node of feature.nodes) {
        sanitized.nodes.push(node);
      }
    }
    if (feature.plugins?.length) {
      feature.plugins.forEach((plugin, i) => {
        sanitized.plugins?.push({
          clientProps: feature.sanitizedClientFeatureProps,
          Component: plugin.Component,
          key: feature.key + i,
          position: plugin.position
        });
      });
    }
    if (feature.toolbarInline?.groups?.length) {
      for (const group of feature.toolbarInline.groups) {
        // 1. find the group with the same key or create new one
        let foundGroup = sanitized.toolbarInline.groups.find(sanitizedGroup => sanitizedGroup.key === group.key);
        if (!foundGroup) {
          foundGroup = {
            ...group,
            items: []
          };
        } else {
          sanitized.toolbarInline.groups = sanitized.toolbarInline.groups.filter(sanitizedGroup => sanitizedGroup.key !== group.key);
        }
        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (group?.items?.length) {
          foundGroup.items = foundGroup.items.concat(group.items);
        }
        sanitized.toolbarInline?.groups.push(foundGroup);
      }
    }
    if (feature.toolbarFixed?.groups?.length) {
      for (const group of feature.toolbarFixed.groups) {
        // 1. find the group with the same key or create new one
        let foundGroup = sanitized.toolbarFixed.groups.find(sanitizedGroup => sanitizedGroup.key === group.key);
        if (!foundGroup) {
          foundGroup = {
            ...group,
            items: []
          };
        } else {
          sanitized.toolbarFixed.groups = sanitized.toolbarFixed.groups.filter(sanitizedGroup => sanitizedGroup.key !== group.key);
        }
        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (group?.items?.length) {
          foundGroup.items = foundGroup.items.concat(group.items);
        }
        sanitized.toolbarFixed?.groups.push(foundGroup);
      }
    }
    if (feature.slashMenu?.groups) {
      if (feature.slashMenu.dynamicGroups?.length) {
        sanitized.slashMenu.dynamicGroups = sanitized.slashMenu.dynamicGroups.concat(feature.slashMenu.dynamicGroups);
      }
      for (const optionGroup of feature.slashMenu.groups) {
        // 1. find the group with the same name or create new one
        let group = sanitized.slashMenu.groups.find(group => group.key === optionGroup.key);
        if (!group) {
          group = {
            ...optionGroup,
            items: []
          };
        } else {
          sanitized.slashMenu.groups = sanitized.slashMenu.groups.filter(group => group.key !== optionGroup.key);
        }
        // 2. Add options to group options array and add to sanitized.slashMenu.groupsWithOptions
        if (optionGroup?.items?.length) {
          group.items = group.items.concat(optionGroup.items);
        }
        sanitized.slashMenu.groups.push(group);
      }
    }
    if (feature.markdownTransformers?.length) {
      // Important: do not use concat
      for (const transformer of feature.markdownTransformers) {
        if (typeof transformer === 'function') {
          sanitized.markdownTransformers.push(transformer({
            allNodes: sanitized.nodes,
            allTransformers: sanitized.markdownTransformers
          }));
        } else {
          sanitized.markdownTransformers.push(transformer);
        }
      }
    }
    sanitized.enabledFeatures.push(feature.key);
  });
  // Apply custom group configurations to toolbarFixed groups
  if (Object.keys(customGroups).length > 0) {
    sanitized.toolbarFixed.groups = sanitized.toolbarFixed.groups.map(group => {
      const customConfig = customGroups[group.key];
      if (customConfig) {
        return deepMerge(group, customConfig);
      }
      return group;
    });
  }
  // Sort sanitized.toolbarInline.groups by order property
  sanitized.toolbarInline.groups.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order;
    } else if (a.order) {
      return -1;
    } else if (b.order) {
      return 1;
    } else {
      return 0;
    }
  });
  // Sort sanitized.toolbarFixed.groups by order property
  sanitized.toolbarFixed.groups.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order;
    } else if (a.order) {
      return -1;
    } else if (b.order) {
      return 1;
    } else {
      return 0;
    }
  });
  // Sort sanitized.toolbarInline.groups.[group].entries by order property
  for (const group of sanitized.toolbarInline.groups) {
    group.items.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      } else if (a.order) {
        return -1;
      } else if (b.order) {
        return 1;
      } else {
        return 0;
      }
    });
  }
  // Sort sanitized.toolbarFixed.groups.[group].entries by order property
  for (const group of sanitized.toolbarFixed.groups) {
    group.items.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      } else if (a.order) {
        return -1;
      } else if (b.order) {
        return 1;
      } else {
        return 0;
      }
    });
  }
  return sanitized;
};
export function sanitizeClientEditorConfig(resolvedClientFeatureMap, lexical, admin) {
  return {
    admin,
    features: sanitizeClientFeatures(resolvedClientFeatureMap),
    lexical: lexical,
    resolvedFeatureMap: resolvedClientFeatureMap
  };
}
//# sourceMappingURL=sanitize.js.map