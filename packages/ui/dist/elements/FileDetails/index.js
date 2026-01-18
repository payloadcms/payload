'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { DraggableFileDetails } from './DraggableFileDetails/index.js';
import { StaticFileDetails } from './StaticFileDetails/index.js';
export const FileDetails = props => {
  const {
    hasMany
  } = props;
  if (hasMany) {
    return /*#__PURE__*/_jsx(DraggableFileDetails, {
      ...props
    });
  }
  return /*#__PURE__*/_jsx(StaticFileDetails, {
    ...props
  });
};
//# sourceMappingURL=index.js.map