import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, use } from 'react';
export const DocumentDrawerCallbacksContext = /*#__PURE__*/createContext({});
export const DocumentDrawerContextProvider = ({
  children,
  ...rest
}) => {
  return /*#__PURE__*/_jsx(DocumentDrawerCallbacksContext, {
    value: {
      ...rest
    },
    children: children
  });
};
export const useDocumentDrawerContext = () => {
  const context = use(DocumentDrawerCallbacksContext);
  if (!context) {
    throw new Error('useDocumentDrawerContext must be used within a DocumentDrawerProvider');
  }
  return context;
};
//# sourceMappingURL=Provider.js.map