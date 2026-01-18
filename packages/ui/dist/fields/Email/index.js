'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { useCallback, useMemo } from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { FieldLabel } from '../FieldLabel/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
const EmailFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        autoComplete,
        className,
        description,
        placeholder
      } = {},
      label,
      localized,
      required
    } = {},
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const {
    i18n
  } = useTranslation();
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
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, 'email', className, showError && 'error', (readOnly || disabled) && 'read-only'].filter(Boolean).join(' '),
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      }), BeforeInput, /*#__PURE__*/_jsx("input", {
        autoComplete: autoComplete,
        disabled: readOnly || disabled,
        id: `field-${path.replace(/\./g, '__')}`,
        name: path,
        onChange: setValue,
        placeholder: getTranslation(placeholder, i18n),
        required: required,
        type: "email",
        value: value_0 || ''
      }), AfterInput]
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const EmailField = withCondition(EmailFieldComponent);
//# sourceMappingURL=index.js.map