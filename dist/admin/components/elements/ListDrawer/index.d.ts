import React from 'react';
import { ListDrawerProps, ListTogglerProps, UseListDrawer } from './types';
import './index.scss';
export declare const baseClass = "list-drawer";
export declare const formatListDrawerSlug: ({ depth, uuid, }: {
    depth: number;
    uuid: string;
}) => string;
export declare const ListDrawerToggler: React.FC<ListTogglerProps>;
export declare const ListDrawer: React.FC<ListDrawerProps>;
export declare const useListDrawer: UseListDrawer;
