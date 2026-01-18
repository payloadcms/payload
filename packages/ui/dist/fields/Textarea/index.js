'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { useCallback, useMemo } from 'react';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import './index.scss';
import { isFieldRTL } from '../shared/index.js';
import { TextareaInput } from './Input.js';
export { TextareaInput };
const TextareaFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        placeholder,
        rows,
        rtl
      } = {},
      label,
      localized,
      maxLength,
      minLength,
      required
    },
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const {
    i18n
  } = useTranslation();
  const {
    config: {
      localization
    }
  } = useConfig();
  const locale = useLocale();
  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined
  });
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === 'function') {
      return validate(value, {
        ...options,
        maxLength,
        minLength,
        required
      });
    }
  }, [validate, required, maxLength, minLength]);
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
  return /*#__PURE__*/_jsx(TextareaInput, {
    AfterInput: AfterInput,
    BeforeInput: BeforeInput,
    className: className,
    Description: Description,
    description: description,
    Error: Error,
    Label: Label,
    label: label,
    localized: localized,
    onChange: e => {
      setValue(e.target.value);
    },
    path: path,
    placeholder: getTranslation(placeholder, i18n),
    readOnly: readOnly || disabled,
    required: required,
    rows: rows,
    rtl: isRTL,
    showError: showError,
    style: styles,
    value: value_0
  });
};
export const TextareaField = withCondition(TextareaFieldComponent);
//# sourceMappingURL=index.js.map