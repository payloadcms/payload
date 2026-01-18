import type { WidgetWidth } from 'payload';
import React from 'react';
import type { WidgetInstanceClient } from './index.client.js';
export declare function useDashboardLayout(initialLayout: WidgetInstanceClient[]): {
    addWidget: (widgetSlug: string) => void;
    cancel: () => void;
    cancelModal: React.FunctionComponentElement<import("@payloadcms/ui/elements/ConfirmationModal").ConfirmationModalProps>;
    currentLayout: WidgetInstanceClient[];
    deleteWidget: (widgetId: string) => void;
    isEditing: boolean;
    moveWidget: ({ moveFromIndex, moveToIndex }: {
        moveFromIndex: number;
        moveToIndex: number;
    }) => void;
    resetLayout: () => Promise<void>;
    resizeWidget: (widgetId: string, newWidth: WidgetWidth) => void;
    saveLayout: () => Promise<void>;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};
//# sourceMappingURL=useDashboardLayout.d.ts.map