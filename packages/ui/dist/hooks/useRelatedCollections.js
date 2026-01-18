'use client';

import { c as _c } from "react/compiler-runtime";
import { useState } from 'react';
import { useConfig } from '../providers/Config/index.js';
/**
 * Gets the corresponding client collection config(s) for the given collection slug.
 */
export const useRelatedCollections = relationTo => {
  const $ = _c(3);
  const {
    getEntityConfig
  } = useConfig();
  let t0;
  if ($[0] !== getEntityConfig || $[1] !== relationTo) {
    t0 = () => {
      if (relationTo) {
        const relations = typeof relationTo === "string" ? [relationTo] : relationTo;
        return relations.map(relation => getEntityConfig({
          collectionSlug: relation
        }));
      }
      return [];
    };
    $[0] = getEntityConfig;
    $[1] = relationTo;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const [relatedCollections] = useState(t0);
  return relatedCollections;
};
//# sourceMappingURL=useRelatedCollections.js.map