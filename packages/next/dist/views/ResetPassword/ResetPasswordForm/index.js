'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConfirmPasswordField, Form, FormSubmit, HiddenField, PasswordField, useAuth, useConfig, useTranslation } from '@payloadcms/ui';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React from 'react';
export const ResetPasswordForm = t0 => {
  const $ = _c(11);
  const {
    token
  } = t0;
  const i18n = useTranslation();
  const {
    config: t1
  } = useConfig();
  const {
    admin: t2,
    routes: t3
  } = t1;
  const {
    routes: t4,
    user: userSlug
  } = t2;
  const {
    login: loginRoute
  } = t4;
  const {
    admin: adminRoute,
    api: apiRoute
  } = t3;
  const history = useRouter();
  const {
    fetchFullUser
  } = useAuth();
  let t5;
  if ($[0] !== adminRoute || $[1] !== fetchFullUser || $[2] !== history || $[3] !== loginRoute) {
    t5 = async () => {
      const user = await fetchFullUser();
      if (user) {
        history.push(adminRoute);
      } else {
        history.push(formatAdminURL({
          adminRoute,
          path: loginRoute
        }));
      }
    };
    $[0] = adminRoute;
    $[1] = fetchFullUser;
    $[2] = history;
    $[3] = loginRoute;
    $[4] = t5;
  } else {
    t5 = $[4];
  }
  const onSuccess = t5;
  let t6;
  if ($[5] !== apiRoute || $[6] !== i18n || $[7] !== onSuccess || $[8] !== token || $[9] !== userSlug) {
    const initialState = {
      "confirm-password": {
        initialValue: "",
        valid: false,
        value: ""
      },
      password: {
        initialValue: "",
        valid: false,
        value: ""
      },
      token: {
        initialValue: token,
        valid: true,
        value: token
      }
    };
    t6 = _jsxs(Form, {
      action: formatAdminURL({
        apiRoute,
        path: `/${userSlug}/reset-password`
      }),
      initialState,
      method: "POST",
      onSuccess,
      children: [_jsxs("div", {
        className: "inputWrap",
        children: [_jsx(PasswordField, {
          field: {
            name: "password",
            label: i18n.t("authentication:newPassword"),
            required: true
          },
          path: "password",
          schemaPath: `${userSlug}.password`
        }), _jsx(ConfirmPasswordField, {}), _jsx(HiddenField, {
          path: "token",
          schemaPath: `${userSlug}.token`,
          value: token
        })]
      }), _jsx(FormSubmit, {
        size: "large",
        children: i18n.t("authentication:resetPassword")
      })]
    });
    $[5] = apiRoute;
    $[6] = i18n;
    $[7] = onSuccess;
    $[8] = token;
    $[9] = userSlug;
    $[10] = t6;
  } else {
    t6 = $[10];
  }
  return t6;
};
//# sourceMappingURL=index.js.map