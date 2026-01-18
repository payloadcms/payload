'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmailField, Form, FormSubmit, TextField, useConfig, useTranslation } from '@payloadcms/ui';
import { email, text } from 'payload/shared';
import React, { useState } from 'react';
import { FormHeader } from '../../../elements/FormHeader/index.js';
export const ForgotPasswordForm = () => {
  const $ = _c(17);
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    admin: t0,
    routes: t1
  } = config;
  const {
    user: userSlug
  } = t0;
  const {
    api
  } = t1;
  const {
    t
  } = useTranslation();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  let t2;
  if ($[0] !== getEntityConfig || $[1] !== userSlug) {
    t2 = getEntityConfig({
      collectionSlug: userSlug
    });
    $[0] = getEntityConfig;
    $[1] = userSlug;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const collectionConfig = t2;
  const loginWithUsername = collectionConfig?.auth?.loginWithUsername;
  let t3;
  if ($[3] !== loginWithUsername || $[4] !== t) {
    t3 = (res, successToast, errorToast) => {
      res.json().then(() => {
        setHasSubmitted(true);
        successToast(t("general:submissionSuccessful"));
      }).catch(() => {
        errorToast(loginWithUsername ? t("authentication:usernameNotValid") : t("authentication:emailNotValid"));
      });
    };
    $[3] = loginWithUsername;
    $[4] = t;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const handleResponse = t3;
  let t4;
  let t5;
  if ($[6] !== api || $[7] !== config || $[8] !== handleResponse || $[9] !== hasSubmitted || $[10] !== loginWithUsername || $[11] !== t || $[12] !== userSlug) {
    t5 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const initialState = loginWithUsername ? {
        username: {
          initialValue: "",
          valid: true,
          value: undefined
        }
      } : {
        email: {
          initialValue: "",
          valid: true,
          value: undefined
        }
      };
      if (hasSubmitted) {
        let t6;
        if ($[15] !== t) {
          t6 = _jsx(FormHeader, {
            description: t("authentication:checkYourEmailForPasswordReset"),
            heading: t("authentication:emailSent")
          });
          $[15] = t;
          $[16] = t6;
        } else {
          t6 = $[16];
        }
        t5 = t6;
        break bb0;
      }
      t4 = _jsxs(Form, {
        action: `${api}/${userSlug}/forgot-password`,
        handleResponse,
        initialState,
        method: "POST",
        children: [_jsx(FormHeader, {
          description: loginWithUsername ? t("authentication:forgotPasswordUsernameInstructions") : t("authentication:forgotPasswordEmailInstructions"),
          heading: t("authentication:forgotPassword")
        }), loginWithUsername ? _jsx(TextField, {
          field: {
            name: "username",
            label: t("authentication:username"),
            required: true
          },
          path: "username",
          validate: value => text(value, {
            name: "username",
            type: "text",
            blockData: {},
            data: {},
            event: "onChange",
            path: ["username"],
            preferences: {
              fields: {}
            },
            req: {
              payload: {
                config
              },
              t
            },
            required: true,
            siblingData: {}
          })
        }) : _jsx(EmailField, {
          field: {
            name: "email",
            admin: {
              autoComplete: "email"
            },
            label: t("general:email"),
            required: true
          },
          path: "email",
          validate: value_0 => email(value_0, {
            name: "email",
            type: "email",
            blockData: {},
            data: {},
            event: "onChange",
            path: ["email"],
            preferences: {
              fields: {}
            },
            req: {
              payload: {
                config
              },
              t
            },
            required: true,
            siblingData: {}
          })
        }), _jsx(FormSubmit, {
          size: "large",
          children: t("general:submit")
        })]
      });
    }
    $[6] = api;
    $[7] = config;
    $[8] = handleResponse;
    $[9] = hasSubmitted;
    $[10] = loginWithUsername;
    $[11] = t;
    $[12] = userSlug;
    $[13] = t4;
    $[14] = t5;
  } else {
    t4 = $[13];
    t5 = $[14];
  }
  if (t5 !== Symbol.for("react.early_return_sentinel")) {
    return t5;
  }
  return t4;
};
//# sourceMappingURL=index.js.map