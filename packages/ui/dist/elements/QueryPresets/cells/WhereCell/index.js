import { jsx as _jsx } from "react/jsx-runtime";
import { toWords } from 'payload/shared';
import React from 'react';
/** @todo: improve this */
const transformWhereToNaturalLanguage = where => {
  if (where.or && where.or.length > 0 && where.or[0].and && where.or[0].and.length > 0) {
    const orQuery = where.or[0];
    const andQuery = orQuery?.and?.[0];
    if (!andQuery || typeof andQuery !== 'object') {
      return 'No where query';
    }
    const key = Object.keys(andQuery)[0];
    if (!key || !andQuery[key] || typeof andQuery[key] !== 'object') {
      return 'No where query';
    }
    const operator = Object.keys(andQuery[key])[0];
    const value = andQuery[key][operator];
    if (typeof value === 'string') {
      return `${toWords(key)} ${operator} ${toWords(value)}`;
    } else if (Array.isArray(value)) {
      return `${toWords(key)} ${operator} ${value.map(val => toWords(val)).join(' or ')}`;
    }
  }
  return '';
};
export const QueryPresetsWhereCell = ({
  cellData
}) => {
  return /*#__PURE__*/_jsx("div", {
    children: cellData ? transformWhereToNaturalLanguage(cellData) : 'No where query'
  });
};
//# sourceMappingURL=index.js.map