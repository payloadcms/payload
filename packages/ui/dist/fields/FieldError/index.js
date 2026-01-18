'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Tooltip } from '../../elements/Tooltip/index.js';
import { useFormFields, useFormSubmitted } from '../../forms/Form/context.js';
import './index.scss';
const baseClass = 'field-error';
export const FieldError = props => {
  const $ = _c(8);
  const {
    alignCaret: t0,
    message: messageFromProps,
    path,
    showError: showErrorFromProps
  } = props;
  const alignCaret = t0 === undefined ? "right" : t0;
  const hasSubmitted = useFormSubmitted();
  let t1;
  if ($[0] !== path) {
    t1 = t2 => {
      const [fields] = t2;
      return fields && fields?.[path] || null;
    };
    $[0] = path;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const field = useFormFields(t1);
  let t2;
  if ($[2] !== alignCaret || $[3] !== field || $[4] !== hasSubmitted || $[5] !== messageFromProps || $[6] !== showErrorFromProps) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const {
        errorMessage,
        valid
      } = field || {};
      const message = messageFromProps || errorMessage;
      const showMessage = showErrorFromProps || hasSubmitted && valid === false;
      if (showMessage && message?.length) {
        t2 = _jsx(Tooltip, {
          alignCaret,
          className: baseClass,
          delay: 0,
          staticPositioning: true,
          children: message
        });
        break bb0;
      }
    }
    $[2] = alignCaret;
    $[3] = field;
    $[4] = hasSubmitted;
    $[5] = messageFromProps;
    $[6] = showErrorFromProps;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  return null;
};
//# sourceMappingURL=index.js.map