import { jsx as _jsx } from "react/jsx-runtime";
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
export function NestProviders({
  children,
  importMap,
  providers,
  serverProps
}) {
  return RenderServerComponent({
    clientProps: {
      children: providers.length > 1 ? /*#__PURE__*/_jsx(NestProviders, {
        importMap: importMap,
        providers: providers.slice(1),
        serverProps: serverProps,
        children: children
      }) : children
    },
    Component: providers[0],
    importMap,
    serverProps
  });
}
//# sourceMappingURL=NestProviders.js.map