'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const ModifyClientFunctionContext = /*#__PURE__*/React.createContext({
  addClientFunction: () => null,
  removeClientFunction: () => null
});
const ClientFunctionsContext = /*#__PURE__*/React.createContext({});
export const ClientFunctionProvider = t0 => {
  const $ = _c(6);
  const {
    children
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {};
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [clientFunctions, setClientFunctions] = React.useState(t1);
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = args => {
      setClientFunctions(state => {
        const newState = {
          ...state
        };
        newState[args.key] = args.func;
        return newState;
      });
    };
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const addClientFunction = t2;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = args_0 => {
      setClientFunctions(state_0 => {
        const newState_0 = {
          ...state_0
        };
        delete newState_0[args_0.key];
        return newState_0;
      });
    };
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const removeClientFunction = t3;
  let t4;
  if ($[3] !== children || $[4] !== clientFunctions) {
    t4 = _jsx(ModifyClientFunctionContext, {
      value: {
        addClientFunction,
        removeClientFunction
      },
      children: _jsx(ClientFunctionsContext, {
        value: clientFunctions,
        children
      })
    });
    $[3] = children;
    $[4] = clientFunctions;
    $[5] = t4;
  } else {
    t4 = $[5];
  }
  return t4;
};
export const useAddClientFunction = (key, func) => {
  const $ = _c(6);
  const {
    addClientFunction,
    removeClientFunction
  } = React.use(ModifyClientFunctionContext);
  let t0;
  let t1;
  if ($[0] !== addClientFunction || $[1] !== func || $[2] !== key || $[3] !== removeClientFunction) {
    t0 = () => {
      addClientFunction({
        func,
        key
      });
      return () => {
        removeClientFunction({
          func,
          key
        });
      };
    };
    t1 = [func, key, addClientFunction, removeClientFunction];
    $[0] = addClientFunction;
    $[1] = func;
    $[2] = key;
    $[3] = removeClientFunction;
    $[4] = t0;
    $[5] = t1;
  } else {
    t0 = $[4];
    t1 = $[5];
  }
  React.useEffect(t0, t1);
};
export const useClientFunctions = () => {
  return React.use(ClientFunctionsContext);
};
//# sourceMappingURL=index.js.map