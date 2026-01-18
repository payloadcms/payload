import type { ServerFunction } from 'payload';
import React from 'react';
export type RenderWidgetServerFnArgs = {
    /**
     * Instance-specific data for this widget
     */
    /**
     * The slug of the widget to render
     */
    widgetSlug: string;
};
export type RenderWidgetServerFnReturnType = {
    component: React.ReactNode;
};
/**
 * Server function to render a widget on-demand.
 * Similar to render-field but specifically for dashboard widgets.
 */
export declare const renderWidgetHandler: ServerFunction<RenderWidgetServerFnArgs, RenderWidgetServerFnReturnType>;
//# sourceMappingURL=renderWidgetServerFn.d.ts.map