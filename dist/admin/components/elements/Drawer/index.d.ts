import React from 'react';
import { Props, TogglerProps } from './types';
import './index.scss';
export declare const formatDrawerSlug: ({ slug, depth, }: {
    slug: string;
    depth: number;
}) => string;
export declare const DrawerToggler: React.FC<TogglerProps>;
export declare const Drawer: React.FC<Props>;
