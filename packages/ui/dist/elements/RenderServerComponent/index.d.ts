import type { ImportMap, PayloadComponent } from 'payload';
import React from 'react';
type RenderServerComponentFn = (args: {
    readonly clientProps?: object;
    readonly Component?: PayloadComponent | PayloadComponent[] | React.ComponentType | React.ComponentType[];
    readonly Fallback?: React.ComponentType;
    readonly importMap: ImportMap;
    readonly key?: string;
    readonly serverProps?: object;
}) => React.ReactNode;
/**
 * Can be used to render both MappedComponents and React Components.
 */
export declare const RenderServerComponent: RenderServerComponentFn;
export {};
//# sourceMappingURL=index.d.ts.map