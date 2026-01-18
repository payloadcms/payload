'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { createPortal } from 'react-dom';
import { LinkEditor } from './LinkEditor/index.js';
export const FloatingLinkEditorPlugin = props => {
  const {
    anchorElem = document.body
  } = props;
  return /*#__PURE__*/createPortal(/*#__PURE__*/_jsx(LinkEditor, {
    anchorElem: anchorElem
  }), anchorElem);
};
//# sourceMappingURL=index.js.map