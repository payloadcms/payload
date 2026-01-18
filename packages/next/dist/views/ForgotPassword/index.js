import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Link } from '@payloadcms/ui';
import { Translation } from '@payloadcms/ui/shared';
import { formatAdminURL } from 'payload/shared';
import React, { Fragment } from 'react';
import { FormHeader } from '../../elements/FormHeader/index.js';
import { ForgotPasswordForm } from './ForgotPasswordForm/index.js';
export const forgotPasswordBaseClass = 'forgot-password';
export function ForgotPasswordView({
  initPageResult
}) {
  const {
    req: {
      i18n,
      payload: {
        config
      },
      user
    }
  } = initPageResult;
  const {
    admin: {
      routes: {
        account: accountRoute,
        login: loginRoute
      }
    },
    routes: {
      admin: adminRoute
    }
  } = config;
  if (user) {
    return /*#__PURE__*/_jsxs(Fragment, {
      children: [/*#__PURE__*/_jsx(FormHeader, {
        description: /*#__PURE__*/_jsx(Translation, {
          elements: {
            '0': ({
              children
            }) => /*#__PURE__*/_jsx(Link, {
              href: formatAdminURL({
                adminRoute,
                path: accountRoute
              }),
              prefetch: false,
              children: children
            })
          },
          i18nKey: "authentication:loggedInChangePassword",
          t: i18n.t
        }),
        heading: i18n.t('authentication:alreadyLoggedIn')
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "secondary",
        el: "link",
        size: "large",
        to: adminRoute,
        children: i18n.t('general:backToDashboard')
      })]
    });
  }
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsx(ForgotPasswordForm, {}), /*#__PURE__*/_jsx(Link, {
      href: formatAdminURL({
        adminRoute,
        path: loginRoute
      }),
      prefetch: false,
      children: i18n.t('authentication:backToLogin')
    })]
  });
}
//# sourceMappingURL=index.js.map