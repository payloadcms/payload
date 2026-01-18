import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { defaultJSXConverters } from '../converter/defaultConverters.js';
import { convertLexicalToJSX } from '../converter/index.js';
export const RichText = ({
  className,
  converters,
  data: editorState,
  disableContainer,
  disableIndent,
  disableTextAlign
}) => {
  if (!editorState) {
    return null;
  }
  let finalConverters = {};
  if (converters) {
    if (typeof converters === 'function') {
      finalConverters = converters({
        defaultConverters: defaultJSXConverters
      });
    } else {
      finalConverters = converters;
    }
  } else {
    finalConverters = defaultJSXConverters;
  }
  const content = editorState && !Array.isArray(editorState) && typeof editorState === 'object' && 'root' in editorState && convertLexicalToJSX({
    converters: finalConverters,
    data: editorState,
    disableIndent,
    disableTextAlign
  });
  if (disableContainer) {
    return /*#__PURE__*/_jsx(_Fragment, {
      children: content
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: className ?? 'payload-richtext',
    children: content
  });
};
//# sourceMappingURL=index.js.map