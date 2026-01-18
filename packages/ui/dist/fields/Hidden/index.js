'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
/**
 * Renders an input with `type="hidden"`.
 * This is mainly used to save a value on the form that is not visible to the user.
 * For example, this sets the `ìd` property of a block in the Blocks field.
 */
const HiddenFieldComponent = props => {
  const $ = _c(13);
  const {
    disableModifyingForm: t0,
    path: pathFromProps,
    value: valueFromProps
  } = props;
  const disableModifyingForm = t0 === undefined ? true : t0;
  let t1;
  if ($[0] !== pathFromProps) {
    t1 = {
      potentiallyStalePath: pathFromProps
    };
    $[0] = pathFromProps;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    formInitializing,
    path,
    setValue,
    value
  } = useField(t1);
  let t2;
  let t3;
  if ($[2] !== disableModifyingForm || $[3] !== formInitializing || $[4] !== setValue || $[5] !== valueFromProps) {
    t2 = () => {
      if (valueFromProps !== undefined && !formInitializing) {
        setValue(valueFromProps, disableModifyingForm);
      }
    };
    t3 = [valueFromProps, setValue, disableModifyingForm, formInitializing];
    $[2] = disableModifyingForm;
    $[3] = formInitializing;
    $[4] = setValue;
    $[5] = valueFromProps;
    $[6] = t2;
    $[7] = t3;
  } else {
    t2 = $[6];
    t3 = $[7];
  }
  useEffect(t2, t3);
  const t4 = `field-${path?.replace(/\./g, "__")}`;
  const t5 = value || "";
  let t6;
  if ($[8] !== path || $[9] !== setValue || $[10] !== t4 || $[11] !== t5) {
    t6 = _jsx("input", {
      id: t4,
      name: path,
      onChange: setValue,
      type: "hidden",
      value: t5
    });
    $[8] = path;
    $[9] = setValue;
    $[10] = t4;
    $[11] = t5;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  return t6;
};
export const HiddenField = withCondition(HiddenFieldComponent);
//# sourceMappingURL=index.js.map