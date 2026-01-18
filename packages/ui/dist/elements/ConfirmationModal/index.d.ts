import React from 'react';
import './index.scss';
export type OnCancel = () => void;
export type ConfirmationModalProps = {
    body: React.ReactNode;
    cancelLabel?: string;
    className?: string;
    confirmingLabel?: string;
    confirmLabel?: string;
    heading: React.ReactNode;
    modalSlug: string;
    onCancel?: OnCancel;
    onConfirm: () => Promise<void> | void;
};
export declare function ConfirmationModal(props: ConfirmationModalProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map