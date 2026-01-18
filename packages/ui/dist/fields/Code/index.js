'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CodeEditor } from '../../elements/CodeEditor/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript'
};
const baseClass = 'code-field';
const CodeFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        editorOptions,
        editorProps,
        language = 'javascript'
      } = {},
      label,
      localized,
      required
    },
    onMount,
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const inputChangeFromRef = React.useRef('formState');
  const [recalculatedHeightAt, setRecalculatedHeightAt] = useState(Date.now());
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
    initialValue,
    path,
    setValue,
    showError,
    value: value_0
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const stringValueRef = React.useRef((value_0 || initialValue) !== undefined ? value_0 ?? initialValue : undefined);
  const handleChange = useCallback(val => {
    if (readOnly || disabled) {
      return;
    }
    inputChangeFromRef.current = 'internalEditor';
    try {
      setValue(val ? val : null);
      stringValueRef.current = val;
    } catch (e) {
      setValue(val ? val : null);
      stringValueRef.current = val;
    }
  }, [readOnly, disabled, setValue]);
  useEffect(() => {
    if (inputChangeFromRef.current === 'formState') {
      stringValueRef.current = (value_0 || initialValue) !== undefined ? value_0 ?? initialValue : undefined;
      setRecalculatedHeightAt(Date.now());
    }
    inputChangeFromRef.current = 'formState';
  }, [initialValue, path, value_0]);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && 'error', (readOnly || disabled) && 'read-only'].filter(Boolean).join(' '),
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
      }), BeforeInput, /*#__PURE__*/_jsx(CodeEditor, {
        defaultLanguage: prismToMonacoLanguageMap[language] || language,
        onChange: handleChange,
        onMount: onMount,
        options: editorOptions,
        readOnly: readOnly || disabled,
        recalculatedHeightAt: recalculatedHeightAt,
        value: stringValueRef.current,
        wrapperProps: {
          id: `field-${path?.replace(/\./g, '__')}`
        },
        ...(editorProps || {})
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
export const CodeField = withCondition(CodeFieldComponent);
//# sourceMappingURL=index.js.map