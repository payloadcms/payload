import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Gutter, RenderTitle } from '@payloadcms/ui';
import React from 'react';
import { DocumentTabs } from './Tabs/index.js';
const baseClass = `doc-header`;
/**
 * @internal
 */
export const DocumentHeader = props => {
  const {
    AfterHeader,
    collectionConfig,
    globalConfig,
    hideTabs,
    permissions,
    req
  } = props;
  return /*#__PURE__*/_jsxs(Gutter, {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__header`,
      children: [/*#__PURE__*/_jsx(RenderTitle, {
        className: `${baseClass}__title`
      }), !hideTabs && /*#__PURE__*/_jsx(DocumentTabs, {
        collectionConfig: collectionConfig,
        globalConfig: globalConfig,
        permissions: permissions,
        req: req
      })]
    }), AfterHeader ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__after-header`,
      children: AfterHeader
    }) : null]
  });
};
//# sourceMappingURL=index.js.map