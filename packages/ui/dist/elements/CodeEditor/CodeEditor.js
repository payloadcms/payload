'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import EditorImport from '@monaco-editor/react';
import React, { useState } from 'react';
import { useTheme } from '../../providers/Theme/index.js';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
import { defaultGlobalEditorOptions, defaultOptions } from './constants.js';
import './index.scss';
const Editor = 'default' in EditorImport ? EditorImport.default : EditorImport;
const baseClass = 'code-editor';
const CodeEditor = props => {
  const $ = _c(10);
  const {
    className,
    maxHeight,
    minHeight,
    options,
    readOnly,
    recalculatedHeightAt,
    value,
    ...rest
  } = props;
  const MIN_HEIGHT = minHeight ?? 56;
  const prevCalculatedHeightAt = React.useRef(recalculatedHeightAt);
  const {
    insertSpaces,
    tabSize,
    trimAutoWhitespace,
    ...globalEditorOptions
  } = options || {};
  const paddingFromProps = options?.padding ? (options.padding.top || 0) + (options.padding?.bottom || 0) : 0;
  const [dynamicHeight, setDynamicHeight] = useState(MIN_HEIGHT);
  const {
    theme
  } = useTheme();
  const t0 = rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : "";
  const t1 = readOnly && "read-only";
  let t2;
  if ($[0] !== className || $[1] !== t0 || $[2] !== t1) {
    t2 = [baseClass, className, t0, t1].filter(Boolean);
    $[0] = className;
    $[1] = t0;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const classes = t2.join(" ");
  let t3;
  let t4;
  if ($[4] !== MIN_HEIGHT || $[5] !== paddingFromProps || $[6] !== recalculatedHeightAt || $[7] !== value) {
    t3 = () => {
      if (recalculatedHeightAt && recalculatedHeightAt > prevCalculatedHeightAt.current) {
        setDynamicHeight(value ? Math.max(MIN_HEIGHT, value.split("\n").length * 18 + 2 + paddingFromProps) : MIN_HEIGHT);
        prevCalculatedHeightAt.current = recalculatedHeightAt;
      }
    };
    t4 = [value, MIN_HEIGHT, paddingFromProps, recalculatedHeightAt];
    $[4] = MIN_HEIGHT;
    $[5] = paddingFromProps;
    $[6] = recalculatedHeightAt;
    $[7] = value;
    $[8] = t3;
    $[9] = t4;
  } else {
    t3 = $[8];
    t4 = $[9];
  }
  React.useEffect(t3, t4);
  return _jsx(Editor, {
    className: classes,
    height: maxHeight ? Math.min(dynamicHeight, maxHeight) : dynamicHeight,
    loading: _jsx(ShimmerEffect, {
      height: dynamicHeight
    }),
    options: {
      ...defaultGlobalEditorOptions,
      ...globalEditorOptions,
      readOnly: Boolean(readOnly),
      detectIndentation: false,
      insertSpaces: undefined,
      tabSize: undefined,
      trimAutoWhitespace: undefined
    },
    theme: theme === "dark" ? "vs-dark" : "vs",
    value,
    ...rest,
    onChange: (value_0, ev) => {
      rest.onChange?.(value_0, ev);
      setDynamicHeight(value_0 ? Math.max(MIN_HEIGHT, value_0.split("\n").length * 18 + 2 + paddingFromProps) : MIN_HEIGHT);
    },
    onMount: (editor, monaco) => {
      rest.onMount?.(editor, monaco);
      const model = editor.getModel();
      if (model) {
        model.updateOptions({
          insertSpaces: insertSpaces ?? defaultOptions.insertSpaces,
          tabSize: tabSize ?? defaultOptions.tabSize,
          trimAutoWhitespace: trimAutoWhitespace ?? defaultOptions.trimAutoWhitespace
        });
      }
      setDynamicHeight(Math.max(MIN_HEIGHT, editor.getValue().split("\n").length * 18 + 2 + paddingFromProps));
    }
  });
};
// eslint-disable-next-line no-restricted-exports
export default CodeEditor;
//# sourceMappingURL=CodeEditor.js.map