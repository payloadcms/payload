import React from 'react';
export type RouteCacheContext = {
    cachingEnabled: boolean;
    clearRouteCache: () => void;
};
export declare const RouteCache: React.FC<{
    cachingEnabled?: boolean;
    children: React.ReactNode;
}>;
export declare const useRouteCache: () => RouteCacheContext;
//# sourceMappingURL=index.d.ts.map