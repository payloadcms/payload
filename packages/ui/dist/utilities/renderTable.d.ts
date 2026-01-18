import type { ClientCollectionConfig, ClientConfig, CollectionConfig, Column, ColumnPreference, Field, ImportMap, ListQuery, PaginatedDocs, Payload, PayloadRequest, SanitizedCollectionConfig, SanitizedFieldsPermissions, ViewTypes } from 'payload';
import { type I18nClient } from '@payloadcms/translations';
import React from 'react';
export declare const renderFilters: (fields: Field[], importMap: ImportMap) => Map<string, React.ReactNode>;
export declare const renderTable: ({ clientCollectionConfig, clientConfig, collectionConfig, collections, columns, customCellProps, data, enableRowSelections, fieldPermissions, groupByFieldPath, groupByValue, heading, i18n, key, orderableFieldName, payload, query, renderRowTypes, req, tableAppearance, useAsTitle, viewType, }: {
    clientCollectionConfig?: ClientCollectionConfig;
    clientConfig?: ClientConfig;
    collectionConfig?: SanitizedCollectionConfig;
    collections?: string[];
    columns: ColumnPreference[];
    customCellProps?: Record<string, unknown>;
    data?: PaginatedDocs | undefined;
    drawerSlug?: string;
    enableRowSelections: boolean;
    fieldPermissions?: SanitizedFieldsPermissions;
    groupByFieldPath?: string;
    groupByValue?: string;
    heading?: string;
    i18n: I18nClient;
    key?: string;
    orderableFieldName: string;
    payload: Payload;
    query?: ListQuery;
    renderRowTypes?: boolean;
    req?: PayloadRequest;
    tableAppearance?: "condensed" | "default";
    useAsTitle: CollectionConfig["admin"]["useAsTitle"];
    viewType?: ViewTypes;
}) => {
    columnState: Column[];
    Table: React.ReactNode;
};
//# sourceMappingURL=renderTable.d.ts.map