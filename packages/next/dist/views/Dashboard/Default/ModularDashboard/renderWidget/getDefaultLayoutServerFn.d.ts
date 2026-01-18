import type { ServerFunction } from 'payload';
import type { WidgetInstanceClient } from '../index.client.js';
export type GetDefaultLayoutServerFnArgs = Record<string, never>;
export type GetDefaultLayoutServerFnReturnType = {
    layout: WidgetInstanceClient[];
};
/**
 * Server function to get the default dashboard layout on-demand.
 * Used when resetting the dashboard to its default configuration.
 */
export declare const getDefaultLayoutHandler: ServerFunction<GetDefaultLayoutServerFnArgs, Promise<GetDefaultLayoutServerFnReturnType>>;
//# sourceMappingURL=getDefaultLayoutServerFn.d.ts.map