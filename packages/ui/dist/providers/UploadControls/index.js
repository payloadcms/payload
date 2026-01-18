'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useState } from 'react';
const Context = /*#__PURE__*/createContext(undefined);
export const UploadControlsProvider = t0 => {
  const $ = _c(5);
  const {
    children
  } = t0;
  const [uploadControlFileName, setUploadControlFileName] = useState(null);
  const [uploadControlFileUrl, setUploadControlFileUrl] = useState("");
  const [uploadControlFile, setUploadControlFile] = useState(null);
  let t1;
  if ($[0] !== children || $[1] !== uploadControlFile || $[2] !== uploadControlFileName || $[3] !== uploadControlFileUrl) {
    t1 = _jsx(Context, {
      value: {
        setUploadControlFile,
        setUploadControlFileName,
        setUploadControlFileUrl,
        uploadControlFile,
        uploadControlFileName,
        uploadControlFileUrl
      },
      children
    });
    $[0] = children;
    $[1] = uploadControlFile;
    $[2] = uploadControlFileName;
    $[3] = uploadControlFileUrl;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
};
export const useUploadControls = () => {
  const context = use(Context);
  if (!context) {
    throw new Error('useUploadControls must be used within an UploadControlsProvider');
  }
  return context;
};
//# sourceMappingURL=index.js.map