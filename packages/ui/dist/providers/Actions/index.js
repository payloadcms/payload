'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useState } from 'react';
const ActionsContext = /*#__PURE__*/createContext({
  Actions: {},
  setViewActions: () => {}
});
export const useActions = () => use(ActionsContext);
export const ActionsProvider = t0 => {
  const $ = _c(4);
  const {
    Actions,
    children
  } = t0;
  const [viewActions, setViewActions] = useState(Actions);
  let t1;
  if ($[0] !== Actions || $[1] !== children || $[2] !== viewActions) {
    t1 = _jsx(ActionsContext, {
      value: {
        Actions: {
          ...viewActions,
          ...Actions
        },
        setViewActions
      },
      children
    });
    $[0] = Actions;
    $[1] = children;
    $[2] = viewActions;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
};
//# sourceMappingURL=index.js.map