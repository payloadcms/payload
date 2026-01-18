import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatAdminURL } from 'payload/shared';
import React from 'react';
import { Logo } from '../../elements/Logo/index.js';
import { ToastAndRedirect } from './index.client.js';
export const verifyBaseClass = 'verify';
export async function Verify({
  initPageResult,
  params,
  searchParams
}) {
  // /:collectionSlug/verify/:token
  const [collectionSlug, verify, token] = params.segments;
  const {
    locale,
    permissions,
    req
  } = initPageResult;
  const {
    i18n,
    payload: {
      config
    },
    payload,
    user
  } = req;
  const {
    routes: {
      admin: adminRoute
    },
    serverURL
  } = config;
  let textToRender;
  let isVerified = false;
  try {
    await req.payload.verifyEmail({
      collection: collectionSlug,
      token
    });
    isVerified = true;
    textToRender = req.t('authentication:emailVerified');
  } catch (e) {
    textToRender = req.t('authentication:unableToVerify');
  }
  if (isVerified) {
    return /*#__PURE__*/_jsx(ToastAndRedirect, {
      message: req.t('authentication:emailVerified'),
      redirectTo: formatAdminURL({
        adminRoute,
        path: '/login'
      })
    });
  }
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx("div", {
      className: `${verifyBaseClass}__brand`,
      children: /*#__PURE__*/_jsx(Logo, {
        i18n: i18n,
        locale: locale,
        params: params,
        payload: payload,
        permissions: permissions,
        searchParams: searchParams,
        user: user
      })
    }), /*#__PURE__*/_jsx("h2", {
      children: textToRender
    })]
  });
}
//# sourceMappingURL=index.js.map