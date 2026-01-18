import type { I18nClient } from '@payloadcms/translations';
import type { ClientField, CollectionPreferences, CollectionSlug, Column, DefaultCellComponentProps, Document, Field, PaginatedDocs, Payload, PayloadRequest, SanitizedCollectionConfig, SanitizedFieldsPermissions, ViewTypes } from 'payload';
import type { SortColumnProps } from '../../../elements/SortColumn/index.js';
export type BuildColumnStateArgs = {
    beforeRows?: Column[];
    clientFields: ClientField[];
    columns?: CollectionPreferences['columns'];
    customCellProps: DefaultCellComponentProps['customCellProps'];
    enableLinkedCell?: boolean;
    enableRowSelections: boolean;
    enableRowTypes?: boolean;
    fieldPermissions?: SanitizedFieldsPermissions;
    i18n: I18nClient;
    payload: Payload;
    req?: PayloadRequest;
    serverFields: Field[];
    sortColumnProps?: Partial<SortColumnProps>;
    useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle'];
    viewType?: ViewTypes;
} & ({
    collectionSlug: CollectionSlug;
    dataType: 'monomorphic';
    docs: PaginatedDocs['docs'];
} | {
    collectionSlug?: undefined;
    dataType: 'polymorphic';
    docs: {
        relationTo: CollectionSlug;
        value: Document;
    }[];
});
export declare const buildColumnState: (args: BuildColumnStateArgs) => Column[];
//# sourceMappingURL=index.d.ts.map