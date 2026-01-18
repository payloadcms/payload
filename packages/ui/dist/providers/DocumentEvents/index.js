'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useState } from 'react';
const Context = /*#__PURE__*/createContext({
  mostRecentUpdate: null,
  reportUpdate: () => null
});
export const DocumentEventsProvider = t0 => {
  const $ = _c(3);
  const {
    children
  } = t0;
  const [mostRecentUpdate, reportUpdate] = useState(null);
  let t1;
  if ($[0] !== children || $[1] !== mostRecentUpdate) {
    t1 = _jsx(Context, {
      value: {
        mostRecentUpdate,
        reportUpdate
      },
      children
    });
    $[0] = children;
    $[1] = mostRecentUpdate;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
/**
 * The useDocumentEvents hook provides a way of subscribing to cross-document events,
 * such as updates made to nested documents within a drawer.
 * This hook will report document events that are outside the scope of the document currently being edited.
 *
 * @link https://payloadcms.com/docs/admin/react-hooks#usedocumentevents
 */
export const useDocumentEvents = () => use(Context);
//# sourceMappingURL=index.js.map