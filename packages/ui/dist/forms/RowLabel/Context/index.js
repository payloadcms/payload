'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useWatchForm } from '../../Form/context.js';
const RowLabel = /*#__PURE__*/React.createContext({
  data: {},
  path: '',
  rowNumber: undefined
});
export const RowLabelProvider = ({
  children,
  path,
  rowNumber
}) => {
  const {
    getDataByPath,
    getSiblingData
  } = useWatchForm();
  const collapsibleData = getSiblingData(path);
  const arrayData = getDataByPath(path);
  const data = arrayData || collapsibleData;
  const contextValue = React.useMemo(() => ({
    data,
    path,
    rowNumber
  }), [data, path, rowNumber]);
  return /*#__PURE__*/_jsx(RowLabel, {
    value: contextValue,
    children: children
  });
};
export const useRowLabel = () => {
  return React.use(RowLabel);
};
//# sourceMappingURL=index.js.map