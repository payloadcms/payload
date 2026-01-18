import React from 'react';
type ContextType = {
    isCollapsed: boolean;
    isVisible: boolean;
    isWithinCollapsible: boolean;
    toggle: () => void;
};
export declare const CollapsibleProvider: React.FC<{
    children?: React.ReactNode;
    isCollapsed?: boolean;
    isWithinCollapsible?: boolean;
    toggle: () => void;
}>;
export declare const useCollapsible: () => ContextType;
export {};
//# sourceMappingURL=provider.d.ts.map