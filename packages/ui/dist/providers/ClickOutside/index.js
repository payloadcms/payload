import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useEffect, useRef } from 'react';
const ClickOutsideContext = /*#__PURE__*/createContext(null);
export const ClickOutsideProvider = ({
  children
}) => {
  const listeners = useRef(new Set());
  useEffect(() => {
    const handleClick = event => {
      listeners.current.forEach(({
        handler,
        ref
      }) => {
        if (ref.current && !ref.current.contains(event.target)) {
          handler();
        }
      });
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const register = listener => listeners.current.add(listener);
  const unregister = listener => listeners.current.delete(listener);
  return /*#__PURE__*/_jsx(ClickOutsideContext, {
    value: {
      register,
      unregister
    },
    children: children
  });
};
export const useClickOutsideContext = () => {
  const context = use(ClickOutsideContext);
  if (!context) {
    throw new Error('useClickOutside must be used within a ClickOutsideProvider');
  }
  return context;
};
//# sourceMappingURL=index.js.map