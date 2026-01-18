import type { PayloadRequest } from '../../index.js';
export declare enum EntityType {
    collection = "collections",
    global = "globals"
}
export type WidgetServerProps = {
    req: PayloadRequest;
    widgetData?: Record<string, unknown>;
    widgetSlug: string;
};
//# sourceMappingURL=dashboard.d.ts.map