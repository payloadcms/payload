import React from 'react';
import type { Props, TogglerProps } from './types.js';
import './index.scss';
export declare const drawerZBase = 100;
export declare const formatDrawerSlug: ({ slug, depth }: {
    depth: number;
    slug: string;
}) => string;
export { useDrawerSlug } from './useDrawerSlug.js';
export declare const DrawerToggler: React.FC<TogglerProps>;
export declare const Drawer: React.FC<Props>;
export declare const DrawerDepthContext: React.Context<number>;
export declare const DrawerDepthProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useDrawerDepth: () => number;
//# sourceMappingURL=index.d.ts.map