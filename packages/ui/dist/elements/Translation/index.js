import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
const RecursiveTranslation = ({
  elements,
  translationString
}) => {
  const regex = /(<[^>]+>.*?<\/[^>]+>)/g;
  const sections = translationString.split(regex);
  return /*#__PURE__*/_jsx("span", {
    children: sections.map((section, index) => {
      if (elements && section.startsWith('<') && section.endsWith('>')) {
        const elementKey = section[1];
        const Element = elements[elementKey];
        if (Element) {
          const regex = new RegExp(`<${elementKey}>(.*?)<\/${elementKey}>`, 'g');
          const children = section.replace(regex, (_, group) => group);
          return /*#__PURE__*/_jsx(Element, {
            children: /*#__PURE__*/_jsx(RecursiveTranslation, {
              translationString: children
            })
          }, index);
        }
      }
      return section;
    })
  });
};
export const Translation = ({
  elements,
  i18nKey,
  t,
  variables
}) => {
  const stringWithVariables = t(i18nKey, variables || {});
  if (!elements) {
    return stringWithVariables;
  }
  return /*#__PURE__*/_jsx(RecursiveTranslation, {
    elements: elements,
    translationString: stringWithVariables
  });
};
//# sourceMappingURL=index.js.map