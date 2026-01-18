import { jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useSelection } from '../../providers/Selection/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Pill } from '../Pill/index.js';
export const SelectMany = props => {
  const {
    onClick
  } = props;
  const {
    count,
    selected
  } = useSelection();
  const {
    t
  } = useTranslation();
  if (!selected || !count) {
    return null;
  }
  return /*#__PURE__*/_jsxs(Pill, {
    onClick: () => {
      if (typeof onClick === 'function') {
        onClick(selected);
      }
    },
    pillStyle: "white",
    size: "small",
    children: [t('general:select'), " ", count]
  });
};
//# sourceMappingURL=index.js.map