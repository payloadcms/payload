'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useState } from 'react';
import { Button } from '../../elements/Button/index.js';
import { useForm } from '../../forms/Form/index.js';
import { useField } from '../../forms/useField/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useServerFunctions } from '../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { FieldLabel } from '../FieldLabel/index.js';
import { TextInput } from '../Text/index.js';
import './index.scss';
/**
 * @experimental This component is experimental and may change or be removed in the future. Use at your own risk.
 */
export const SlugField = t0 => {
  const $ = _c(24);
  const {
    field,
    path,
    readOnly: readOnlyFromProps,
    useAsSlug
  } = t0;
  const {
    label
  } = field;
  const {
    t
  } = useTranslation();
  const {
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const {
    slugify
  } = useServerFunctions();
  const t1 = path || field.name;
  let t2;
  if ($[0] !== t1) {
    t2 = {
      path: t1
    };
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const {
    setValue,
    value
  } = useField(t2);
  const {
    getData,
    getDataByPath
  } = useForm();
  const [isLocked, setIsLocked] = useState(true);
  let t3;
  if ($[2] !== collectionSlug || $[3] !== getData || $[4] !== getDataByPath || $[5] !== globalSlug || $[6] !== path || $[7] !== setValue || $[8] !== slugify || $[9] !== useAsSlug || $[10] !== value) {
    t3 = async e => {
      e.preventDefault();
      const valueToSlugify = getDataByPath(useAsSlug);
      const formattedSlug = await slugify({
        collectionSlug,
        data: getData(),
        globalSlug,
        path,
        valueToSlugify
      });
      if (formattedSlug === null || formattedSlug === undefined) {
        setValue("");
        return;
      }
      if (value !== formattedSlug) {
        setValue(formattedSlug);
      }
    };
    $[2] = collectionSlug;
    $[3] = getData;
    $[4] = getDataByPath;
    $[5] = globalSlug;
    $[6] = path;
    $[7] = setValue;
    $[8] = slugify;
    $[9] = useAsSlug;
    $[10] = value;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  const handleGenerate = t3;
  let t4;
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = e_0 => {
      e_0.preventDefault();
      setIsLocked(_temp);
    };
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  const toggleLock = t4;
  const t5 = `field-${path}`;
  let t6;
  if ($[13] !== field.name || $[14] !== handleGenerate || $[15] !== isLocked || $[16] !== label || $[17] !== path || $[18] !== readOnlyFromProps || $[19] !== setValue || $[20] !== t || $[21] !== t5 || $[22] !== value) {
    t6 = _jsxs("div", {
      className: "field-type slug-field-component",
      children: [_jsxs("div", {
        className: "label-wrapper",
        children: [_jsx(FieldLabel, {
          htmlFor: t5,
          label
        }), !isLocked && _jsx(Button, {
          buttonStyle: "none",
          className: "lock-button",
          onClick: handleGenerate,
          children: t("authentication:generate")
        }), _jsx(Button, {
          buttonStyle: "none",
          className: "lock-button",
          onClick: toggleLock,
          children: isLocked ? t("general:unlock") : t("general:lock")
        })]
      }), _jsx(TextInput, {
        onChange: setValue,
        path: path || field.name,
        readOnly: Boolean(readOnlyFromProps || isLocked),
        value
      })]
    });
    $[13] = field.name;
    $[14] = handleGenerate;
    $[15] = isLocked;
    $[16] = label;
    $[17] = path;
    $[18] = readOnlyFromProps;
    $[19] = setValue;
    $[20] = t;
    $[21] = t5;
    $[22] = value;
    $[23] = t6;
  } else {
    t6 = $[23];
  }
  return t6;
};
function _temp(prev) {
  return !prev;
}
//# sourceMappingURL=index.js.map