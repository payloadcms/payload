'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const baseClass = 'login__form';
import { Form, FormSubmit, Link, PasswordField, useAuth, useConfig, useTranslation } from '@payloadcms/ui';
import { formatAdminURL, getLoginOptions, getSafeRedirect } from 'payload/shared';
import { LoginField } from '../LoginField/index.js';
export const LoginForm = t0 => {
  const $ = _c(23);
  const {
    prefillEmail,
    prefillPassword,
    prefillUsername,
    searchParams
  } = t0;
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    admin: t1,
    routes: t2
  } = config;
  const {
    routes: t3,
    user: userSlug
  } = t1;
  const {
    forgot: forgotRoute
  } = t3;
  const {
    admin: adminRoute,
    api: apiRoute
  } = t2;
  let loginWithUsername;
  let t4;
  if ($[0] !== getEntityConfig || $[1] !== userSlug) {
    const collectionConfig = getEntityConfig({
      collectionSlug: userSlug
    });
    const {
      auth: authOptions
    } = collectionConfig;
    loginWithUsername = authOptions.loginWithUsername;
    t4 = getLoginOptions(loginWithUsername);
    $[0] = getEntityConfig;
    $[1] = userSlug;
    $[2] = loginWithUsername;
    $[3] = t4;
  } else {
    loginWithUsername = $[2];
    t4 = $[3];
  }
  const {
    canLoginWithEmail,
    canLoginWithUsername
  } = t4;
  let t5;
  if ($[4] !== canLoginWithEmail || $[5] !== canLoginWithUsername) {
    t5 = () => {
      if (canLoginWithEmail && canLoginWithUsername) {
        return "emailOrUsername";
      }
      if (canLoginWithUsername) {
        return "username";
      }
      return "email";
    };
    $[4] = canLoginWithEmail;
    $[5] = canLoginWithUsername;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  const [loginType] = React.useState(t5);
  const {
    t
  } = useTranslation();
  const {
    setUser
  } = useAuth();
  const t6 = prefillPassword ?? undefined;
  const t7 = prefillPassword ?? undefined;
  let t8;
  if ($[7] !== adminRoute || $[8] !== apiRoute || $[9] !== forgotRoute || $[10] !== loginType || $[11] !== loginWithUsername || $[12] !== prefillEmail || $[13] !== prefillUsername || $[14] !== searchParams?.redirect || $[15] !== setUser || $[16] !== t || $[17] !== t6 || $[18] !== t7 || $[19] !== userSlug) {
    const initialState = {
      password: {
        initialValue: t6,
        valid: true,
        value: t7
      }
    };
    if (loginWithUsername) {
      initialState.username = {
        initialValue: prefillUsername ?? undefined,
        valid: true,
        value: prefillUsername ?? undefined
      };
    } else {
      initialState.email = {
        initialValue: prefillEmail ?? undefined,
        valid: true,
        value: prefillEmail ?? undefined
      };
    }
    let t9;
    if ($[21] !== setUser) {
      t9 = data => {
        setUser(data);
      };
      $[21] = setUser;
      $[22] = t9;
    } else {
      t9 = $[22];
    }
    const handleLogin = t9;
    t8 = _jsxs(Form, {
      action: formatAdminURL({
        apiRoute,
        path: `/${userSlug}/login`
      }),
      className: baseClass,
      disableSuccessStatus: true,
      initialState,
      method: "POST",
      onSuccess: handleLogin,
      redirect: getSafeRedirect({
        fallbackTo: adminRoute,
        redirectTo: searchParams?.redirect
      }),
      waitForAutocomplete: true,
      children: [_jsxs("div", {
        className: `${baseClass}__inputWrap`,
        children: [_jsx(LoginField, {
          type: loginType
        }), _jsx(PasswordField, {
          field: {
            name: "password",
            label: t("general:password"),
            required: true
          },
          path: "password"
        })]
      }), _jsx(Link, {
        href: formatAdminURL({
          adminRoute,
          path: forgotRoute
        }),
        prefetch: false,
        children: t("authentication:forgotPasswordQuestion")
      }), _jsx(FormSubmit, {
        size: "large",
        children: t("authentication:login")
      })]
    });
    $[7] = adminRoute;
    $[8] = apiRoute;
    $[9] = forgotRoute;
    $[10] = loginType;
    $[11] = loginWithUsername;
    $[12] = prefillEmail;
    $[13] = prefillUsername;
    $[14] = searchParams?.redirect;
    $[15] = setUser;
    $[16] = t;
    $[17] = t6;
    $[18] = t7;
    $[19] = userSlug;
    $[20] = t8;
  } else {
    t8 = $[20];
  }
  return t8;
};
//# sourceMappingURL=index.js.map