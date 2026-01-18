import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toWords } from 'payload/shared';
import React, { Fragment } from 'react';
export const QueryPresetsAccessCell = ({
  cellData
}) => {
  // first sort the operations in the order they should be displayed
  const operations = ['read', 'update', 'delete'];
  return /*#__PURE__*/_jsx("p", {
    children: operations.reduce((acc, operation, index) => {
      const operationData = cellData?.[operation];
      if (operationData && operationData.constraint) {
        acc.push(/*#__PURE__*/_jsxs(Fragment, {
          children: [/*#__PURE__*/_jsxs("span", {
            children: [/*#__PURE__*/_jsx("strong", {
              children: toWords(operation)
            }), ": ", toWords(operationData.constraint)]
          }), index !== operations.length - 1 && ', ']
        }, operation));
      }
      return acc;
    }, [])
  });
};
//# sourceMappingURL=index.js.map