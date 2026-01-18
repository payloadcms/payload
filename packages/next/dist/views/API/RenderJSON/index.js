'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronIcon } from '@payloadcms/ui';
import * as React from 'react';
const chars = {
  leftCurlyBracket: '\u007B',
  leftSquareBracket: '\u005B',
  rightCurlyBracket: '\u007D',
  rightSquareBracket: '\u005D'
};
const baseClass = 'query-inspector';
const Bracket = ({
  type,
  comma = false,
  position
}) => {
  const rightBracket = type === 'object' ? chars.rightCurlyBracket : chars.rightSquareBracket;
  const leftBracket = type === 'object' ? chars.leftCurlyBracket : chars.leftSquareBracket;
  const bracketToRender = position === 'end' ? rightBracket : leftBracket;
  return /*#__PURE__*/_jsxs("span", {
    className: `${baseClass}__bracket ${baseClass}__bracket--position-${position}`,
    children: [bracketToRender, position === 'end' && comma ? ',' : null]
  });
};
export const RenderJSON = t0 => {
  const $ = _c(2);
  const {
    isEmpty: t1,
    object,
    objectKey,
    parentType: t2,
    trailingComma: t3
  } = t0;
  const isEmpty = t1 === undefined ? false : t1;
  const parentType = t2 === undefined ? "object" : t2;
  const trailingComma = t3 === undefined ? false : t3;
  const objectKeys = object ? Object.keys(object) : [];
  const objectLength = objectKeys.length;
  const [isOpen, setIsOpen] = React.useState(true);
  const isNested = parentType === "object" || parentType === "array";
  let t4;
  if ($[0] !== isOpen) {
    t4 = () => setIsOpen(!isOpen);
    $[0] = isOpen;
    $[1] = t4;
  } else {
    t4 = $[1];
  }
  return _jsxs("li", {
    className: isNested ? `${baseClass}__row-line--nested` : "",
    children: [_jsxs("button", {
      "aria-label": "toggle",
      className: `${baseClass}__list-toggle ${isEmpty ? `${baseClass}__list-toggle--empty` : ""}`,
      onClick: t4,
      type: "button",
      children: [isEmpty ? null : _jsx(ChevronIcon, {
        className: `${baseClass}__toggle-row-icon ${baseClass}__toggle-row-icon--${isOpen ? "open" : "closed"}`
      }), _jsxs("span", {
        children: [objectKey && `"${objectKey}": `, _jsx(Bracket, {
          position: "start",
          type: parentType
        }), isEmpty ? _jsx(Bracket, {
          comma: trailingComma,
          position: "end",
          type: parentType
        }) : null]
      })]
    }), _jsx("ul", {
      className: `${baseClass}__json-children ${isNested ? `${baseClass}__json-children--nested` : ""}`,
      children: isOpen && objectKeys.map((key, keyIndex) => {
        let value = object[key];
        let type;
        const isLastKey = keyIndex === objectLength - 1;
        if (value === null) {
          type = "null";
        } else {
          if (value instanceof Date) {
            type = "date";
            value = value.toISOString();
          } else {
            if (Array.isArray(value)) {
              type = "array";
            } else {
              if (typeof value === "object") {
                type = "object";
              } else {
                if (typeof value === "number") {
                  type = "number";
                } else {
                  if (typeof value === "boolean") {
                    type = "boolean";
                  } else {
                    type = "string";
                  }
                }
              }
            }
          }
        }
        if (type === "object" || type === "array") {
          return _jsx(RenderJSON, {
            isEmpty: value.length === 0 || Object.keys(value).length === 0,
            object: value,
            objectKey: parentType === "object" ? key : undefined,
            parentType: type,
            trailingComma: !isLastKey
          }, `${key}-${keyIndex}`);
        }
        if (type === "date" || type === "string" || type === "null" || type === "number" || type === "boolean") {
          const parentHasKey = Boolean(parentType === "object" && key);
          const rowClasses = [`${baseClass}__row-line`, `${baseClass}__value-type--${type}`, `${baseClass}__row-line--${objectKey ? "nested" : "top"}`].filter(Boolean).join(" ");
          return _jsxs("li", {
            className: rowClasses,
            children: [parentHasKey ? _jsx("span", {
              children: `"${key}": `
            }) : null, _jsx("span", {
              className: `${baseClass}__value`,
              children: JSON.stringify(value)
            }), isLastKey ? "" : ","]
          }, `${key}-${keyIndex}`);
        }
      })
    }), !isEmpty && _jsx("span", {
      className: isNested ? `${baseClass}__bracket--nested` : "",
      children: _jsx(Bracket, {
        comma: trailingComma,
        position: "end",
        type: parentType
      })
    })]
  });
};
//# sourceMappingURL=index.js.map