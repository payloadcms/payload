import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { NodeFormat } from '../../../../../lexical/utils/nodeFormat.js';
export const TextJSXConverter = {
  text: ({
    node
  }) => {
    let text = node.text;
    if (node.format & NodeFormat.IS_BOLD) {
      text = /*#__PURE__*/_jsx("strong", {
        children: text
      });
    }
    if (node.format & NodeFormat.IS_ITALIC) {
      text = /*#__PURE__*/_jsx("em", {
        children: text
      });
    }
    if (node.format & NodeFormat.IS_STRIKETHROUGH) {
      text = /*#__PURE__*/_jsx("span", {
        style: {
          textDecoration: 'line-through'
        },
        children: text
      });
    }
    if (node.format & NodeFormat.IS_UNDERLINE) {
      text = /*#__PURE__*/_jsx("span", {
        style: {
          textDecoration: 'underline'
        },
        children: text
      });
    }
    if (node.format & NodeFormat.IS_CODE) {
      text = /*#__PURE__*/_jsx("code", {
        children: text
      });
    }
    if (node.format & NodeFormat.IS_SUBSCRIPT) {
      text = /*#__PURE__*/_jsx("sub", {
        children: text
      });
    }
    if (node.format & NodeFormat.IS_SUPERSCRIPT) {
      text = /*#__PURE__*/_jsx("sup", {
        children: text
      });
    }
    return text;
  }
};
//# sourceMappingURL=text.js.map