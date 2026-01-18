'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
const baseClass = 'render-field-diffs';
import { ShimmerEffect } from '@payloadcms/ui';
import React, { Fragment, useEffect } from 'react';
export const RenderVersionFieldsToDiff = t0 => {
  const $ = _c(6);
  const {
    parent: t1,
    versionFields
  } = t0;
  const parent = t1 === undefined ? false : t1;
  const [hasMounted, setHasMounted] = React.useState(false);
  let t2;
  let t3;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      setHasMounted(true);
    };
    t3 = [];
    $[0] = t2;
    $[1] = t3;
  } else {
    t2 = $[0];
    t3 = $[1];
  }
  useEffect(t2, t3);
  const t4 = `${baseClass}${parent ? ` ${baseClass}--parent` : ""}`;
  let t5;
  if ($[2] !== hasMounted || $[3] !== t4 || $[4] !== versionFields) {
    t5 = _jsx("div", {
      className: t4,
      children: !hasMounted ? _jsx(Fragment, {
        children: _jsx(ShimmerEffect, {
          height: "8rem",
          width: "100%"
        })
      }) : versionFields?.map(_temp)
    });
    $[2] = hasMounted;
    $[3] = t4;
    $[4] = versionFields;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  return t5;
};
function _temp(field, fieldIndex) {
  if (field.fieldByLocale) {
    const LocaleComponents = [];
    for (const [locale, baseField] of Object.entries(field.fieldByLocale)) {
      LocaleComponents.push(_jsx("div", {
        className: `${baseClass}__locale`,
        "data-field-path": baseField.path,
        "data-locale": locale,
        children: _jsx("div", {
          className: `${baseClass}__locale-value`,
          children: baseField.CustomComponent
        })
      }, [locale, fieldIndex].join("-")));
    }
    return _jsx("div", {
      className: `${baseClass}__field`,
      children: LocaleComponents
    }, fieldIndex);
  } else {
    if (field.field) {
      return _jsx("div", {
        className: `${baseClass}__field field__${field.field.type}`,
        "data-field-path": field.field.path,
        children: field.field.CustomComponent
      }, fieldIndex);
    }
  }
  return null;
}
//# sourceMappingURL=RenderVersionFieldsToDiff.js.map