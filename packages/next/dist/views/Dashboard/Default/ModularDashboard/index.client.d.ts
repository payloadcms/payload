import type { ClientWidget, WidgetWidth } from 'payload';
import React from 'react';
export type WidgetItem = {
    id: string;
    maxWidth: WidgetWidth;
    minWidth: WidgetWidth;
    width: WidgetWidth;
};
export type WidgetInstanceClient = {
    component: React.ReactNode;
    item: WidgetItem;
};
export type DropTargetWidget = {
    position: 'after' | 'before';
    widget: WidgetInstanceClient;
} | null;
export declare function ModularDashboardClient({ clientLayout: initialLayout, widgets, }: {
    clientLayout: WidgetInstanceClient[];
    widgets: ClientWidget[];
}): React.JSX.Element;
//# sourceMappingURL=index.client.d.ts.map