'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { rtlLanguages } from '@payloadcms/translations';
import React, { useCallback, useMemo } from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { useForm } from '../../forms/Form/context.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { generateFieldID } from '../../utilities/generateFieldID.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
import { CheckboxInput } from './Input.js';
import './index.scss';
const baseClass = 'checkbox';
export { CheckboxInput };
const CheckboxFieldComponent = props => {
  const {
    id,
    checked: checkedFromProps,
    disableFormData,
    field,
    field: {
      admin: {
        className,
        description
      } = {},
      label,
      required
    } = {},
    onChange: onChangeFromProps,
    partialChecked,
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const {
    uuid
  } = useForm();
  const editDepth = useEditDepth();
  const {
    i18n: {
      language
    }
  } = useTranslation();
  const isRTL = rtlLanguages.includes(language);
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === 'function') {
      return validate(value, {
        ...options,
        required
      });
    }
  }, [validate, required]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    path,
    setValue,
    showError,
    value: value_0
  } = useField({
    disableFormData,
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value_0);
      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(!value_0);
      }
    }
  }, [onChangeFromProps, readOnly, setValue, value_0]);
  const checked = checkedFromProps || Boolean(value_0);
  const fieldID = id || generateFieldID(path, editDepth, uuid);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, showError && 'error', className, value_0 && `${baseClass}--checked`, (readOnly || disabled) && `${baseClass}--read-only`].filter(Boolean).join(' '),
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        alignCaret: isRTL ? 'right' : 'left',
        path: path,
        showError: showError
      })
    }), /*#__PURE__*/_jsx(CheckboxInput, {
      AfterInput: AfterInput,
      BeforeInput: BeforeInput,
      checked: checked,
      id: fieldID,
      inputRef: null,
      Label: Label,
      label: label,
      name: path,
      onToggle: onToggle,
      partialChecked: partialChecked,
      readOnly: readOnly || disabled,
      required: required
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const CheckboxField = withCondition(CheckboxFieldComponent);
//# sourceMappingURL=index.js.map