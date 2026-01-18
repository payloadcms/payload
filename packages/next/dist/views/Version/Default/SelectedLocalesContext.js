'use client';

import { createContext, use } from 'react';
export const SelectedLocalesContext = /*#__PURE__*/createContext({
  selectedLocales: []
});
export const useSelectedLocales = () => use(SelectedLocalesContext);
//# sourceMappingURL=SelectedLocalesContext.js.map