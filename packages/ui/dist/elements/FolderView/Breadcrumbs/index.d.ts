import type { FolderBreadcrumb } from 'payload/shared';
import React from 'react';
import './index.scss';
type Props = {
    readonly breadcrumbs: {
        id: null | number | string;
        name: React.ReactNode | string;
        onClick: () => void;
    }[];
    className?: string;
};
export declare function FolderBreadcrumbs({ breadcrumbs, className }: Props): React.JSX.Element;
export declare function DroppableBreadcrumb({ id, children, className, onClick, }: {
    children: React.ReactNode;
    className?: string;
    onClick: () => void;
} & Pick<FolderBreadcrumb, 'id'>): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map