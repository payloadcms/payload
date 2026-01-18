import React from 'react';
import './index.scss';
export type PopupTriggerProps = {
    active: boolean;
    button: React.ReactNode;
    buttonType: 'custom' | 'default' | 'none';
    className?: string;
    disabled?: boolean;
    noBackground?: boolean;
    setActive: (active: boolean, viaKeyboard?: boolean) => void;
    size?: 'large' | 'medium' | 'small' | 'xsmall';
};
export declare const PopupTrigger: React.FC<PopupTriggerProps>;
//# sourceMappingURL=index.d.ts.map