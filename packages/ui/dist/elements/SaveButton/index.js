'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { useRef } from 'react';
import { useForm, useFormModified } from '../../forms/Form/context.js';
import { FormSubmit } from '../../forms/Submit/index.js';
import { useHotkey } from '../../hooks/useHotkey.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useOperation } from '../../providers/Operation/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
export function SaveButton({
  label: labelProp
}) {
  const {
    uploadStatus
  } = useDocumentInfo();
  const {
    t
  } = useTranslation();
  const {
    submit
  } = useForm();
  const modified = useFormModified();
  const label = labelProp || t('general:save');
  const ref = useRef(null);
  const editDepth = useEditDepth();
  const operation = useOperation();
  const disabled = operation === 'update' && !modified || uploadStatus === 'uploading';
  useHotkey({
    cmdCtrlKey: true,
    editDepth,
    keyCodes: ['s']
  }, e => {
    if (disabled) {
      // absorb the event
    }
    e.preventDefault();
    e.stopPropagation();
    if (ref?.current) {
      ref.current.click();
    }
  });
  const handleSubmit = () => {
    if (uploadStatus === 'uploading') {
      return;
    }
    return void submit();
  };
  return /*#__PURE__*/_jsx(FormSubmit, {
    buttonId: "action-save",
    disabled: disabled,
    onClick: handleSubmit,
    ref: ref,
    size: "medium",
    type: "button",
    children: label
  });
}
//# sourceMappingURL=index.js.map