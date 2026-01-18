'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback } from 'react';
export const EntityVisibilityContext = /*#__PURE__*/createContext({});
export const EntityVisibilityProvider = t0 => {
  const $ = _c(6);
  const {
    children,
    visibleEntities
  } = t0;
  let t1;
  if ($[0] !== visibleEntities) {
    t1 = t2 => {
      const {
        collectionSlug,
        globalSlug
      } = t2;
      if (collectionSlug) {
        return visibleEntities.collections.includes(collectionSlug);
      }
      if (globalSlug) {
        return visibleEntities.globals.includes(globalSlug);
      }
      return false;
    };
    $[0] = visibleEntities;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const isEntityVisible = t1;
  let t2;
  if ($[2] !== children || $[3] !== isEntityVisible || $[4] !== visibleEntities) {
    t2 = _jsx(EntityVisibilityContext, {
      value: {
        isEntityVisible,
        visibleEntities
      },
      children
    });
    $[2] = children;
    $[3] = isEntityVisible;
    $[4] = visibleEntities;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
};
export const useEntityVisibility = () => use(EntityVisibilityContext);
//# sourceMappingURL=index.js.map