'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Button } from '../../elements/Button/index.js';
import { useForm, useFormBackgroundProcessing, useFormInitializing, useFormProcessing } from '../Form/context.js';
import './index.scss';
const baseClass = 'form-submit';
export const FormSubmit = props => {
  const {
    type = 'submit',
    buttonId: id,
    children,
    disabled: disabledFromProps,
    onClick,
    programmaticSubmit,
    ref
  } = props;
  const processing = useFormProcessing();
  const backgroundProcessing = useFormBackgroundProcessing();
  const initializing = useFormInitializing();
  const {
    disabled,
    submit
  } = useForm();
  const canSave = !(disabledFromProps || initializing || processing || backgroundProcessing || disabled);
  const handleClick = onClick ?? (programmaticSubmit ? () => {
    void submit();
  } : undefined);
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx(Button, {
      ref: ref,
      ...props,
      disabled: canSave ? undefined : true,
      id: id,
      onClick: handleClick,
      type: type,
      children: children
    })
  });
};
//# sourceMappingURL=index.js.map