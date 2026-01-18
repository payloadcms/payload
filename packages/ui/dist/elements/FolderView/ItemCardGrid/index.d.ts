import type { FolderOrDocument } from 'payload/shared';
import React from 'react';
import './index.scss';
type ItemCardGridProps = {
    items: FolderOrDocument[];
    title?: string;
} & ({
    subfolderCount: number;
    type: 'file';
} | {
    subfolderCount?: never;
    type: 'folder';
});
export declare function ItemCardGrid({ type, items, subfolderCount, title }: ItemCardGridProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map