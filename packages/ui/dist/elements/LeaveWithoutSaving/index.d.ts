import React from 'react';
import type { OnCancel } from '../ConfirmationModal/index.js';
type LeaveWithoutSavingProps = {
    disablePreventLeave?: boolean;
    modalSlug?: string;
    onConfirm?: () => Promise<void> | void;
    onPrevent?: (nextHref: null | string) => void;
};
export declare const LeaveWithoutSaving: React.FC<LeaveWithoutSavingProps>;
export declare const LeaveWithoutSavingModal: ({ modalSlug, onCancel, onConfirm, }: {
    modalSlug: string;
    onCancel?: OnCancel;
    onConfirm: () => Promise<void> | void;
}) => React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map