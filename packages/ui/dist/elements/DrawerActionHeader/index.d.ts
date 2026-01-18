import React from 'react';
import './index.scss';
type DrawerActionHeaderArgs = {
    readonly cancelLabel?: string;
    className?: string;
    readonly onCancel?: () => void;
    readonly onSave?: () => void;
    readonly saveLabel?: string;
    readonly title: React.ReactNode | string;
};
export declare const DrawerActionHeader: ({ cancelLabel, className, onCancel, onSave, saveLabel, title, }: DrawerActionHeaderArgs) => React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map