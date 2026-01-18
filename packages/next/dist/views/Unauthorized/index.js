import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Gutter } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
import { FormHeader } from '../../elements/FormHeader/index.js';
const baseClass = 'unauthorized';
export function UnauthorizedView({
  initPageResult
}) {
  const {
    permissions,
    req: {
      i18n,
      payload: {
        config: {
          admin: {
            routes: {
              logout: logoutRoute
            }
          },
          routes: {
            admin: adminRoute
          }
        }
      },
      user
    }
  } = initPageResult;
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx(FormHeader, {
      description: i18n.t('error:notAllowedToAccessPage'),
      heading: i18n.t(user && !permissions.canAccessAdmin ? 'error:unauthorizedAdmin' : 'error:unauthorized')
    }), /*#__PURE__*/_jsx(Button, {
      className: `${baseClass}__button`,
      el: "link",
      size: "large",
      to: formatAdminURL({
        adminRoute,
        path: logoutRoute
      }),
      children: i18n.t('authentication:logOut')
    })]
  });
}
export const UnauthorizedViewWithGutter = props => {
  return /*#__PURE__*/_jsx(Gutter, {
    className: [baseClass, `${baseClass}--with-gutter`].join(' '),
    children: /*#__PURE__*/_jsx(UnauthorizedView, {
      ...props
    })
  });
};
//# sourceMappingURL=index.js.map