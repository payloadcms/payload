import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { HtmlDiff } from './diff/index.js';
import './index.scss';
const baseClass = 'html-diff';
export const getHTMLDiffComponents = ({
  fromHTML,
  toHTML,
  tokenizeByCharacter
}) => {
  const diffHTML = new HtmlDiff(fromHTML, toHTML, {
    tokenizeByCharacter
  });
  const [oldHTML, newHTML] = diffHTML.getSideBySideContents();
  const From = oldHTML ? /*#__PURE__*/_jsx("div", {
    className: `${baseClass}__diff-old html-diff`,
    dangerouslySetInnerHTML: {
      __html: oldHTML
    }
  }) : null;
  const To = newHTML ? /*#__PURE__*/_jsx("div", {
    className: `${baseClass}__diff-new html-diff`,
    dangerouslySetInnerHTML: {
      __html: newHTML
    }
  }) : null;
  return {
    From,
    To
  };
};
//# sourceMappingURL=index.js.map