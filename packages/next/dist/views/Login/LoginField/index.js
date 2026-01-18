'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { EmailField, TextField, useTranslation } from '@payloadcms/ui';
import { email, username } from 'payload/shared';
import React from 'react';
export const LoginField = t0 => {
  const $ = _c(11);
  const {
    type,
    required: t1
  } = t0;
  const required = t1 === undefined ? true : t1;
  const {
    t
  } = useTranslation();
  if (type === "email") {
    let t2;
    if ($[0] !== required || $[1] !== t) {
      t2 = _jsx(EmailField, {
        field: {
          name: "email",
          admin: {
            autoComplete: "email"
          },
          label: t("general:email"),
          required
        },
        path: "email",
        validate: email
      });
      $[0] = required;
      $[1] = t;
      $[2] = t2;
    } else {
      t2 = $[2];
    }
    return t2;
  }
  if (type === "username") {
    let t2;
    if ($[3] !== required || $[4] !== t) {
      t2 = _jsx(TextField, {
        field: {
          name: "username",
          label: t("authentication:username"),
          required
        },
        path: "username",
        validate: username
      });
      $[3] = required;
      $[4] = t;
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    return t2;
  }
  if (type === "emailOrUsername") {
    let t2;
    if ($[6] !== required || $[7] !== t) {
      let t3;
      if ($[9] !== t) {
        t3 = (value, options) => {
          const passesUsername = username(value, options);
          const passesEmail = email(value, options);
          if (!passesEmail && !passesUsername) {
            return `${t("general:email")}: ${passesEmail} ${t("general:username")}: ${passesUsername}`;
          }
          return true;
        };
        $[9] = t;
        $[10] = t3;
      } else {
        t3 = $[10];
      }
      t2 = _jsx(TextField, {
        field: {
          name: "username",
          label: t("authentication:emailOrUsername"),
          required
        },
        path: "username",
        validate: t3
      });
      $[6] = required;
      $[7] = t;
      $[8] = t2;
    } else {
      t2 = $[8];
    }
    return t2;
  }
  return null;
};
//# sourceMappingURL=index.js.map