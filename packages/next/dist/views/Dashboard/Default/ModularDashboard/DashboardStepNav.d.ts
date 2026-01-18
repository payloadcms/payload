import type { ClientWidget } from 'payload';
export declare function DashboardStepNav({ addWidget, cancel, isEditing, resetLayout, saveLayout, setIsEditing, widgets, }: {
    addWidget: (slug: string) => void;
    cancel: () => void;
    isEditing: boolean;
    resetLayout: () => Promise<void>;
    saveLayout: () => Promise<void>;
    setIsEditing: (isEditing: boolean) => void;
    widgets: ClientWidget[];
}): import("react").JSX.Element;
export declare function DashboardBreadcrumbDropdown(props: {
    isEditing: boolean;
    onCancel: () => void;
    onEditClick: () => void;
    onResetLayout: () => void;
    onSaveChanges: () => void;
    widgetsDrawerSlug: string;
}): import("react").JSX.Element;
//# sourceMappingURL=DashboardStepNav.d.ts.map