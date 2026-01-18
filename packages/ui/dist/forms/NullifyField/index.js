'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Banner } from '../../elements/Banner/index.js';
import { CheckboxField } from '../../fields/Checkbox/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { useForm } from '../Form/context.js';
import './index.scss';
const baseClass = 'nullify-locale-field';
export const NullifyLocaleField = t0 => {
  const $ = _c(13);
  const {
    fieldValue,
    localized,
    path,
    readOnly: t1
  } = t0;
  const readOnly = t1 === undefined ? false : t1;
  const {
    code: currentLocale
  } = useLocale();
  const {
    config: t2
  } = useConfig();
  const {
    localization
  } = t2;
  const [checked, setChecked] = React.useState(typeof fieldValue !== "number");
  const {
    t
  } = useTranslation();
  const {
    dispatchFields,
    setModified
  } = useForm();
  if (!localized || !localization) {
    return null;
  }
  if (localization.defaultLocale === currentLocale || !localization.fallback) {
    return null;
  }
  let t3;
  if ($[0] !== checked || $[1] !== dispatchFields || $[2] !== fieldValue || $[3] !== path || $[4] !== setModified) {
    t3 = () => {
      const useFallback = !checked;
      dispatchFields({
        type: "UPDATE",
        path,
        value: useFallback ? null : fieldValue || 0
      });
      setModified(true);
      setChecked(useFallback);
    };
    $[0] = checked;
    $[1] = dispatchFields;
    $[2] = fieldValue;
    $[3] = path;
    $[4] = setModified;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const onChange = t3;
  if (fieldValue) {
    let hideCheckbox = false;
    if (typeof fieldValue === "number" && fieldValue > 0) {
      hideCheckbox = true;
    }
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      hideCheckbox = true;
    }
    if (hideCheckbox) {
      if (checked) {
        setChecked(false);
      }
      return null;
    }
  }
  let t4;
  if ($[6] !== checked || $[7] !== fieldValue || $[8] !== onChange || $[9] !== path || $[10] !== readOnly || $[11] !== t) {
    t4 = _jsx(Banner, {
      className: baseClass,
      children: !fieldValue && readOnly ? t("general:fallbackToDefaultLocale") : _jsx(CheckboxField, {
        checked,
        field: {
          name: "",
          label: t("general:fallbackToDefaultLocale")
        },
        id: `field-${path.replace(/\./g, "__")}`,
        onChange,
        path,
        schemaPath: ""
      })
    });
    $[6] = checked;
    $[7] = fieldValue;
    $[8] = onChange;
    $[9] = path;
    $[10] = readOnly;
    $[11] = t;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
};
//# sourceMappingURL=index.js.map