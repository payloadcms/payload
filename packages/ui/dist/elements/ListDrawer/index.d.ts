import React from 'react';
import type { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types.js';
export * from './types.js';
export declare const baseClass = "list-drawer";
export declare const formatListDrawerSlug: ({ depth, uuid, }: {
    depth: number;
    uuid: string;
}) => string;
export declare const ListDrawerToggler: React.FC<ListTogglerProps>;
export declare const ListDrawer: React.FC<ListDrawerProps>;
/**
 * Returns an array containing the ListDrawer component, the ListDrawerToggler component, and an object with state and methods for controlling the drawer.
 * @example
 * import { useListDrawer } from '@payloadcms/ui'
 *
 * // inside a React component
 * const [ListDrawer, ListDrawerToggler, { closeDrawer, openDrawer }] = useListDrawer({
 *   collectionSlugs: ['users'],
 *   selectedCollection: 'users',
 * })
 *
 * // inside the return statement
 * return (
 *    <>
 *      <ListDrawer />
 *      <ListDrawerToggler onClick={openDrawer}>Open List Drawer</ListDrawerToggler>
 *    </>
 * )
 */
export declare const useListDrawer: UseListDrawer;
//# sourceMappingURL=index.d.ts.map