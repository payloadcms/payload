'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const EditorPlugin = ({
  anchorElem,
  clientProps,
  plugin
}) => {
  if (plugin.position === 'floatingAnchorElem' && anchorElem) {
    return plugin.Component && /*#__PURE__*/_jsx(plugin.Component, {
      anchorElem: anchorElem,
      clientProps: clientProps
    });
  }
  // @ts-expect-error - ts is not able to infer that plugin.Component is of type PluginComponent
  return plugin.Component && /*#__PURE__*/_jsx(plugin.Component, {
    clientProps: clientProps
  });
};
//# sourceMappingURL=EditorPlugin.js.map