'use client';

import { useConfig, useEntityVisibility } from '@payloadcms/ui';
import * as React from 'react';
export const useEnabledRelationships = options => {
  const {
    collectionSlugsBlacklist,
    collectionSlugsWhitelist,
    uploads = false
  } = options || {};
  const {
    config: {
      collections
    }
  } = useConfig();
  const {
    visibleEntities
  } = useEntityVisibility();
  const result = React.useMemo(() => {
    const enabledCollectionSlugs = [];
    const enabledCollections = [];
    const whitelistSet = collectionSlugsWhitelist ? new Set(collectionSlugsWhitelist) : null;
    const blacklistSet = collectionSlugsBlacklist ? new Set(collectionSlugsBlacklist) : null;
    for (const collection of collections) {
      const {
        slug,
        admin: {
          enableRichTextRelationship
        },
        upload
      } = collection;
      // Check visibility
      if (!visibleEntities?.collections.includes(slug)) {
        continue;
      }
      // Check rich text relationship and upload settings
      if (uploads) {
        if (!enableRichTextRelationship || !upload) {
          continue;
        }
      } else {
        if (upload || !enableRichTextRelationship) {
          continue;
        }
      }
      // Check whitelist (if provided, only include slugs in the whitelist)
      if (whitelistSet && !whitelistSet.has(slug)) {
        continue;
      }
      // Check blacklist (if provided, exclude slugs in the blacklist)
      if (blacklistSet && blacklistSet.has(slug)) {
        continue;
      }
      enabledCollectionSlugs.push(slug);
      enabledCollections.push(collection);
    }
    return {
      enabledCollections,
      enabledCollectionSlugs
    };
  }, [collections, visibleEntities, uploads, collectionSlugsWhitelist, collectionSlugsBlacklist]);
  return result;
};
//# sourceMappingURL=useEnabledRelationships.js.map