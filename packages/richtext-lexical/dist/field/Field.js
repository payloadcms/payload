'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BulkUploadProvider, FieldDescription, FieldError, FieldLabel, RenderCustomComponent, useEditDepth, useEffectEvent, useField } from '@payloadcms/ui';
import { mergeFieldStyles } from '@payloadcms/ui/shared';
import { dequal } from 'dequal/lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import './bundled.css';
import { LexicalProvider } from '../lexical/LexicalProvider.js';
import { useRunDeprioritized } from '../utilities/useRunDeprioritized.js';
const baseClass = 'rich-text-lexical';
const RichTextComponent = props => {
  const {
    editorConfig,
    field,
    field: {
      admin: {
        className,
        description,
        readOnly: readOnlyFromAdmin
      } = {},
      label,
      localized,
      required
    },
    path: pathFromProps,
    readOnly: readOnlyFromTopLevelProps,
    validate
  } = props;
  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin;
  const editDepth = useEditDepth();
  const memoizedValidate = useCallback((value, validationOptions) => {
    if (typeof validate === 'function') {
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      return validate(value, {
        ...validationOptions,
        required
      });
    }
    return true;
  },
  // Important: do not add props to the dependencies array.
  // This would cause an infinite loop and endless re-rendering.
  // Removing props from the dependencies array fixed this issue: https://github.com/payloadcms/payload/issues/3709
  [validate, required]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled: disabledFromField,
    initialValue,
    path,
    setValue,
    showError,
    value: value_0
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const disabled = readOnlyFromProps || disabledFromField;
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState(false);
  const [rerenderProviderKey, setRerenderProviderKey] = useState();
  const prevInitialValueRef = React.useRef(initialValue);
  const prevValueRef = React.useRef(value_0);
  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = window.matchMedia('(max-width: 768px)').matches;
      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);
    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);
  const classes = [baseClass, 'field-type', className, showError && 'error', disabled && `${baseClass}--read-only`, editorConfig?.admin?.hideGutter !== true && !isSmallWidthViewport ? `${baseClass}--show-gutter` : null].filter(Boolean).join(' ');
  const pathWithEditDepth = `${path}.${editDepth}`;
  const runDeprioritized = useRunDeprioritized() // defaults to 500 ms timeout
  ;
  const handleChange = useCallback(editorState => {
    // Capture `editorState` in the closure so we can safely run later.
    const updateFieldValue = () => {
      const newState = editorState.toJSON();
      prevValueRef.current = newState;
      setValue(newState);
    };
    // Queue the update for the browser’s idle time (or Safari shim)
    // and let the hook handle debouncing/cancellation.
    void runDeprioritized(updateFieldValue);
  }, [setValue, runDeprioritized]);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  const handleInitialValueChange = useEffectEvent(initialValue_0 => {
    // Object deep equality check here, as re-mounting the editor if
    // the new value is the same as the old one is not necessary.
    // In postgres, the order of keys in JSON objects is not guaranteed to be preserved,
    // so we need to do a deep equality check here that does not care about key order => we use dequal.
    // If we used JSON.stringify, the editor would re-mount every time you save the document, as the order of keys changes => change detected => re-mount.
    if (prevValueRef.current !== value_0 && !dequal(prevValueRef.current != null ? JSON.parse(JSON.stringify(prevValueRef.current)) : prevValueRef.current, value_0)) {
      prevInitialValueRef.current = initialValue_0;
      prevValueRef.current = value_0;
      setRerenderProviderKey(new Date());
    }
  });
  useEffect(() => {
    // Needs to trigger for object reference changes - otherwise,
    // reacting to the same initial value change twice will cause
    // the second change to be ignored, even though the value has changed.
    // That's because initialValue is not kept up-to-date
    if (!Object.is(initialValue, prevInitialValueRef.current)) {
      handleInitialValueChange(initialValue);
    }
  }, [initialValue]);
  return /*#__PURE__*/_jsxs("div", {
    className: classes,
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        path: path,
        showError: showError
      })
    }), Label || /*#__PURE__*/_jsx(FieldLabel, {
      label: label,
      localized: localized,
      path: path,
      required: required
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__wrap`,
      children: [/*#__PURE__*/_jsxs(ErrorBoundary, {
        fallbackRender: fallbackRender,
        onReset: () => {},
        children: [BeforeInput, /*#__PURE__*/_jsx(BulkUploadProvider, {
          drawerSlugPrefix: path,
          children: /*#__PURE__*/_jsx(LexicalProvider, {
            composerKey: pathWithEditDepth,
            editorConfig: editorConfig,
            fieldProps: props,
            isSmallWidthViewport: isSmallWidthViewport,
            onChange: handleChange,
            readOnly: disabled,
            value: value_0
          }, JSON.stringify({
            path,
            rerenderProviderKey
          }))
        }), AfterInput]
      }), /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    })]
  }, pathWithEditDepth);
};
function fallbackRender({
  error
}) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  return /*#__PURE__*/_jsxs("div", {
    className: "errorBoundary",
    role: "alert",
    children: [/*#__PURE__*/_jsx("p", {
      children: "Something went wrong:"
    }), /*#__PURE__*/_jsx("pre", {
      style: {
        color: 'red'
      },
      children: error.message
    })]
  });
}
export const RichText = RichTextComponent;
//# sourceMappingURL=Field.js.map