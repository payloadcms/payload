import { type CollectionSlug, type JoinFieldClient, type PaginatedDocs, type Where } from 'payload';
import React from 'react';
import type { DocumentDrawerProps } from '../DocumentDrawer/types.js';
import './index.scss';
type RelationshipTableComponentProps = {
    readonly AfterInput?: React.ReactNode;
    readonly allowCreate?: boolean;
    readonly BeforeInput?: React.ReactNode;
    readonly disableTable?: boolean;
    readonly field: JoinFieldClient;
    readonly fieldPath?: string;
    readonly filterOptions?: Where;
    readonly initialData?: PaginatedDocs;
    readonly initialDrawerData?: DocumentDrawerProps['initialData'];
    readonly Label?: React.ReactNode;
    readonly parent?: {
        collectionSlug: CollectionSlug;
        id: number | string;
        joinPath: string;
    };
    readonly relationTo: string | string[];
};
export type OnDrawerOpen = (id?: string) => void;
export declare const RelationshipTable: React.FC<RelationshipTableComponentProps>;
export {};
//# sourceMappingURL=index.d.ts.map