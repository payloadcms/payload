import { createContext, use } from 'react';
export const ListQueryContext = createContext({});
export const useListQuery = () => use(ListQueryContext);
export const ListQueryModifiedContext = createContext(false);
export const useListQueryModified = () => use(ListQueryModifiedContext);
//# sourceMappingURL=context.js.map