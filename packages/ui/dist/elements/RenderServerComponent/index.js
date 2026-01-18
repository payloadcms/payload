import { jsx as _jsx } from "react/jsx-runtime";
import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared';
import React from 'react';
import { removeUndefined } from '../../utilities/removeUndefined.js';
/**
 * Can be used to render both MappedComponents and React Components.
 */
export const RenderServerComponent = ({
  clientProps = {},
  Component,
  Fallback,
  importMap,
  key,
  serverProps
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) => RenderServerComponent({
      clientProps,
      Component: c,
      importMap,
      key: index,
      serverProps
    }));
  }
  if (typeof Component === 'function') {
    const isRSC = isReactServerComponentOrFunction(Component);
    // prevent $undefined from being passed through the rsc requests
    const sanitizedProps = removeUndefined({
      ...clientProps,
      ...(isRSC ? serverProps : {})
    });
    return /*#__PURE__*/_jsx(Component, {
      ...sanitizedProps
    }, key);
  }
  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getFromImportMap({
      importMap,
      PayloadComponent: Component,
      schemaPath: ''
    });
    if (ResolvedComponent) {
      const isRSC = isReactServerComponentOrFunction(ResolvedComponent);
      // prevent $undefined from being passed through rsc requests
      const sanitizedProps = removeUndefined({
        ...clientProps,
        ...(isRSC ? serverProps : {}),
        ...(isRSC && typeof Component === 'object' && Component?.serverProps ? Component.serverProps : {}),
        ...(typeof Component === 'object' && Component?.clientProps ? Component.clientProps : {})
      });
      return /*#__PURE__*/_jsx(ResolvedComponent, {
        ...sanitizedProps
      }, key);
    }
  }
  return Fallback ? RenderServerComponent({
    clientProps,
    Component: Fallback,
    importMap,
    key,
    serverProps
  }) : null;
};
//# sourceMappingURL=index.js.map