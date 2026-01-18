import type { LinkProps } from 'next/link.js';
import * as React from 'react';
import './index.scss';
export { PopupListDivider as Divider } from '../PopupDivider/index.js';
export { PopupListGroupLabel as GroupLabel } from '../PopupGroupLabel/index.js';
export declare const ButtonGroup: React.FC<{
    buttonSize?: 'default' | 'small';
    children: React.ReactNode;
    className?: string;
    textAlign?: 'center' | 'left' | 'right';
}>;
type MenuButtonProps = {
    active?: boolean;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    href?: LinkProps['href'];
    id?: string;
    onClick?: (e?: React.MouseEvent) => void;
};
export declare const Button: React.FC<MenuButtonProps>;
//# sourceMappingURL=index.d.ts.map