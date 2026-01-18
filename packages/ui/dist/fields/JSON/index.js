'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { defaultOptions } from '../../elements/CodeEditor/constants.js';
import { CodeEditor } from '../../elements/CodeEditor/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { FieldDescription } from '../FieldDescription/index.js';
import { FieldError } from '../FieldError/index.js';
import { FieldLabel } from '../FieldLabel/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
const baseClass = 'json-field';
const JSONFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        editorOptions,
        maxHeight
      } = {},
      jsonSchema,
      label,
      localized,
      required
    },
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const {
    insertSpaces = defaultOptions.insertSpaces,
    tabSize = defaultOptions.tabSize
  } = editorOptions || {};
  const formatJSON = useCallback(value => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return '';
    }
    return insertSpaces ? JSON.stringify(value, null, tabSize) : JSON.stringify(value, null, '\t');
  }, [tabSize, insertSpaces]);
  const [jsonError, setJsonError] = useState();
  const inputChangeFromRef = React.useRef('formState');
  const [recalculatedHeightAt, setRecalculatedHeightAt] = useState(Date.now());
  const memoizedValidate = useCallback((value_0, options) => {
    if (typeof validate === 'function') {
      return validate(value_0, {
        ...options,
        jsonError,
        required
      });
    }
  }, [validate, required, jsonError]);
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
    value: value_1
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const stringValueRef = React.useRef(formatJSON(value_1 ?? initialValue));
  const handleMount = useCallback((editor, monaco) => {
    if (!jsonSchema) {
      return;
    }
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      enableSchemaRequest: true,
      schemas: [...(monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas || []), jsonSchema],
      validate: true
    });
    const uri = jsonSchema.uri;
    const newUri = uri.includes('?') ? `${uri}&${crypto.randomUUID ? crypto.randomUUID() : uuidv4()}` : `${uri}?${crypto.randomUUID ? crypto.randomUUID() : uuidv4()}`;
    editor.setModel(monaco.editor.createModel(formatJSON(value_1) || '', 'json', monaco.Uri.parse(newUri)));
  }, [jsonSchema, formatJSON, value_1]);
  const handleChange = useCallback(val => {
    if (readOnly || disabled) {
      return;
    }
    inputChangeFromRef.current = 'internalEditor';
    try {
      setValue(val ? JSON.parse(val) : null);
      stringValueRef.current = val;
      setJsonError(undefined);
    } catch (e) {
      setValue(val ? val : null);
      stringValueRef.current = val;
      setJsonError(e);
    }
  }, [readOnly, disabled, setValue]);
  useEffect(() => {
    if (inputChangeFromRef.current === 'formState') {
      const newStringValue = formatJSON(value_1 ?? initialValue);
      if (newStringValue !== stringValueRef.current) {
        stringValueRef.current = newStringValue;
        setRecalculatedHeightAt(Date.now());
      }
    }
    inputChangeFromRef.current = 'formState';
  }, [initialValue, path, formatJSON, value_1]);
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
          message: jsonError,
          path: path,
          showError: showError
        })
      }), BeforeInput, /*#__PURE__*/_jsx(CodeEditor, {
        defaultLanguage: "json",
        maxHeight: maxHeight,
        onChange: handleChange,
        onMount: handleMount,
        options: editorOptions,
        readOnly: readOnly || disabled,
        recalculatedHeightAt: recalculatedHeightAt,
        value: stringValueRef.current,
        wrapperProps: {
          id: `field-${path?.replace(/\./g, '__')}`
        }
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
export const JSONField = withCondition(JSONFieldComponent);
//# sourceMappingURL=index.js.map