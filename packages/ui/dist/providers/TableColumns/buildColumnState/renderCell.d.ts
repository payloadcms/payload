import type { I18nClient } from '@payloadcms/translations';
import type { ClientField, DefaultCellComponentProps, Document, Field, Payload, PayloadRequest, ViewTypes } from 'payload';
type RenderCellArgs = {
    readonly clientField: ClientField;
    readonly collectionSlug: string;
    readonly columnIndex: number;
    readonly customCellProps: DefaultCellComponentProps['customCellProps'];
    readonly doc: Document;
    readonly enableRowSelections: boolean;
    readonly i18n: I18nClient;
    readonly isLinkedColumn: boolean;
    readonly payload: Payload;
    readonly req?: PayloadRequest;
    readonly rowIndex: number;
    readonly serverField: Field;
    readonly viewType?: ViewTypes;
};
export declare function renderCell({ clientField, collectionSlug, columnIndex, customCellProps, doc, enableRowSelections, i18n, isLinkedColumn, payload, req, rowIndex, serverField, viewType, }: RenderCellArgs): import("react").JSX.Element;
export {};
//# sourceMappingURL=renderCell.d.ts.map