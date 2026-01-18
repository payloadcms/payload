import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, use } from 'react';
export const ListDrawerContext = /*#__PURE__*/createContext({});
export const ListDrawerContextProvider = ({
  children,
  ...rest
}) => {
  return /*#__PURE__*/_jsx(ListDrawerContext, {
    value: {
      isInDrawer: Boolean(rest.drawerSlug),
      ...rest
    },
    children: children
  });
};
export const useListDrawerContext = () => {
  const context = use(ListDrawerContext);
  if (!context) {
    throw new Error('useListDrawerContext must be used within a ListDrawerContextProvider');
  }
  return context;
};
//# sourceMappingURL=Provider.js.map