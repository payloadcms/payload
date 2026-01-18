import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ListSelection } from '../ListSelection/index.js';
import './index.scss';
const baseClass = 'group-by-header';
export const GroupByHeader = ({
  collectionConfig,
  groupByFieldPath,
  groupByValue,
  heading
}) => {
  return /*#__PURE__*/_jsxs("header", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx("h4", {
      className: `${baseClass}__heading`,
      "data-group-id": groupByValue,
      children: heading
    }), /*#__PURE__*/_jsx(ListSelection, {
      collectionConfig: collectionConfig,
      label: heading,
      modalPrefix: groupByValue,
      where: {
        [groupByFieldPath]: {
          equals: groupByValue
        }
      }
    })]
  });
};
//# sourceMappingURL=index.js.map