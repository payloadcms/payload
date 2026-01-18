'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const Context = /*#__PURE__*/React.createContext({
  getUploadEdits: () => undefined,
  resetUploadEdits: undefined,
  updateUploadEdits: undefined,
  uploadEdits: undefined
});
export const UploadEditsProvider = t0 => {
  const $ = _c(10);
  const {
    children,
    initialUploadEdits
  } = t0;
  let t1;
  if ($[0] !== initialUploadEdits) {
    t1 = initialUploadEdits || {};
    $[0] = initialUploadEdits;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const [uploadEdits, setUploadEdits] = React.useState(t1);
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      setUploadEdits({});
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const resetUploadEdits = t2;
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = edits => {
      setUploadEdits(prevEdits => ({
        ...(prevEdits || {}),
        ...(edits || {})
      }));
    };
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const updateUploadEdits = t3;
  let t4;
  if ($[4] !== uploadEdits) {
    t4 = () => uploadEdits;
    $[4] = uploadEdits;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  const getUploadEdits = t4;
  let t5;
  if ($[6] !== children || $[7] !== getUploadEdits || $[8] !== uploadEdits) {
    t5 = _jsx(Context, {
      value: {
        getUploadEdits,
        resetUploadEdits,
        updateUploadEdits,
        uploadEdits
      },
      children
    });
    $[6] = children;
    $[7] = getUploadEdits;
    $[8] = uploadEdits;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  return t5;
};
export const useUploadEdits = () => React.use(Context);
//# sourceMappingURL=index.js.map