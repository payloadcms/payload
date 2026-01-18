import type { ClientBlock, ClientWidget, Labels } from 'payload';
import React from 'react';
import './index.scss';
export type DrawerItem = ClientBlock | ClientWidget;
export type ItemsDrawerProps = {
    readonly addRowIndex?: number;
    readonly drawerSlug: string;
    readonly items: (DrawerItem | string)[];
    readonly labels?: Labels;
    readonly onItemClick: (item: DrawerItem, index?: number) => Promise<void> | void;
    readonly searchPlaceholder?: string;
    readonly title?: string;
};
export declare const ItemsDrawer: React.FC<ItemsDrawerProps>;
//# sourceMappingURL=index.d.ts.map