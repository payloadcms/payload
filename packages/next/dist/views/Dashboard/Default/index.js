import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Gutter } from '@payloadcms/ui';
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
import { ModularDashboard } from './ModularDashboard/index.js';
const baseClass = 'dashboard';
export function DefaultDashboard(props) {
  const {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user
  } = props;
  const {
    afterDashboard,
    beforeDashboard
  } = payload.config.admin.components;
  return /*#__PURE__*/_jsxs(Gutter, {
    className: baseClass,
    children: [beforeDashboard && RenderServerComponent({
      Component: beforeDashboard,
      importMap: payload.importMap,
      serverProps: {
        i18n,
        locale,
        params,
        payload,
        permissions,
        searchParams,
        user
      }
    }), /*#__PURE__*/_jsx(ModularDashboard, {
      ...props
    }), afterDashboard && RenderServerComponent({
      Component: afterDashboard,
      importMap: payload.importMap,
      serverProps: {
        i18n,
        locale,
        params,
        payload,
        permissions,
        searchParams,
        user
      }
    })]
  });
}
//# sourceMappingURL=index.js.map