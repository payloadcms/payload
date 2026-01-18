import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { LogoutClient } from './LogoutClient.js';
const baseClass = 'logout';
export const LogoutView = ({
  inactivity,
  initPageResult,
  searchParams
}) => {
  const {
    req: {
      payload: {
        config: {
          routes: {
            admin: adminRoute
          }
        }
      }
    }
  } = initPageResult;
  return /*#__PURE__*/_jsx("div", {
    className: `${baseClass}`,
    children: /*#__PURE__*/_jsx(LogoutClient, {
      adminRoute: adminRoute,
      inactivity: inactivity,
      redirect: searchParams.redirect
    })
  });
};
export function LogoutInactivity(props) {
  return /*#__PURE__*/_jsx(LogoutView, {
    inactivity: true,
    ...props
  });
}
//# sourceMappingURL=index.js.map