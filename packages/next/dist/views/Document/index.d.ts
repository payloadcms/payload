import type { AdminViewServerProps, Data, DocumentViewClientProps, DocumentViewServerProps, EditViewComponent, PayloadComponent, RenderDocumentVersionsProperties } from 'payload';
import React from 'react';
import type { GenerateEditViewMetadata } from './getMetaBySegment.js';
export declare const generateMetadata: GenerateEditViewMetadata;
export type ViewToRender = EditViewComponent | PayloadComponent<DocumentViewServerProps> | React.FC | React.FC<DocumentViewClientProps>;
/**
 * This function is responsible for rendering
 * an Edit Document view on the server for both:
 *  - default document edit views
 *  - on-demand edit views within drawers
 */
export declare const renderDocument: ({ disableActions, documentSubViewType, drawerSlug, importMap, initialData, initPageResult, overrideEntityVisibility, params, redirectAfterCreate, redirectAfterDelete, redirectAfterDuplicate, redirectAfterRestore, searchParams, versions, viewType, }: {
    drawerSlug?: string;
    overrideEntityVisibility?: boolean;
    readonly redirectAfterCreate?: boolean;
    readonly redirectAfterDelete?: boolean;
    readonly redirectAfterDuplicate?: boolean;
    readonly redirectAfterRestore?: boolean;
    versions?: RenderDocumentVersionsProperties;
} & AdminViewServerProps) => Promise<{
    data: Data;
    Document: React.ReactNode;
}>;
export declare function DocumentView(props: AdminViewServerProps): Promise<React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | (string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode>)>;
//# sourceMappingURL=index.d.ts.map