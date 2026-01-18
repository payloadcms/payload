import type { AdminViewConfig, SanitizedConfig } from 'payload';
import type { ViewFromConfig } from './getRouteData.js';
export declare const getCustomViewByRoute: ({ config, currentRoute: currentRouteWithAdmin, }: {
    config: SanitizedConfig;
    currentRoute: string;
}) => {
    view: ViewFromConfig;
    viewConfig: AdminViewConfig;
    viewKey: string;
};
//# sourceMappingURL=getCustomViewByRoute.d.ts.map