'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useState } from 'react';
const Context = /*#__PURE__*/React.createContext(null);
export const UploadHandlersProvider = t0 => {
  const $ = _c(6);
  const {
    children
  } = t0;
  const [uploadHandlers, setUploadHandlers] = useState(_temp);
  let t1;
  if ($[0] !== uploadHandlers) {
    t1 = t2 => {
      const {
        collectionSlug
      } = t2;
      return uploadHandlers.get(collectionSlug);
    };
    $[0] = uploadHandlers;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const getUploadHandler = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = t3 => {
      const {
        collectionSlug: collectionSlug_0,
        handler
      } = t3;
      setUploadHandlers(uploadHandlers_0 => {
        const clone = new Map(uploadHandlers_0);
        clone.set(collectionSlug_0, handler);
        return clone;
      });
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const setUploadHandler = t2;
  let t3;
  if ($[3] !== children || $[4] !== getUploadHandler) {
    t3 = _jsx(Context, {
      value: {
        getUploadHandler,
        setUploadHandler
      },
      children
    });
    $[3] = children;
    $[4] = getUploadHandler;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
};
export const useUploadHandlers = () => {
  const context = React.use(Context);
  if (context === null) {
    throw new Error('useUploadHandlers must be used within UploadHandlersProvider');
  }
  return context;
};
function _temp() {
  return new Map();
}
//# sourceMappingURL=index.js.map