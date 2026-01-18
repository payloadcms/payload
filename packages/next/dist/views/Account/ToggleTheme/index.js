'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { RadioGroupField, useTheme, useTranslation } from '@payloadcms/ui';
import React, { useCallback } from 'react';
export const ToggleTheme = () => {
  const $ = _c(7);
  const {
    autoMode,
    setTheme,
    theme
  } = useTheme();
  const {
    t
  } = useTranslation();
  let t0;
  if ($[0] !== setTheme) {
    t0 = newTheme => {
      setTheme(newTheme);
    };
    $[0] = setTheme;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onChange = t0;
  let t1;
  if ($[2] !== autoMode || $[3] !== onChange || $[4] !== t || $[5] !== theme) {
    t1 = _jsx(RadioGroupField, {
      disableModifyingForm: true,
      field: {
        name: "theme",
        label: t("general:adminTheme"),
        options: [{
          label: t("general:automatic"),
          value: "auto"
        }, {
          label: t("general:light"),
          value: "light"
        }, {
          label: t("general:dark"),
          value: "dark"
        }]
      },
      onChange,
      path: "theme",
      value: autoMode ? "auto" : theme
    });
    $[2] = autoMode;
    $[3] = onChange;
    $[4] = t;
    $[5] = theme;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
};
//# sourceMappingURL=index.js.map