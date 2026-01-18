import type { SanitizedPermissions } from '../../auth/types.js';
import type { SanitizedCollectionConfig } from '../../collections/config/types.js';
import type { PayloadComponent, SanitizedConfig, ServerProps } from '../../config/types.js';
import type { SanitizedGlobalConfig } from '../../globals/config/types.js';
import type { PayloadRequest } from '../../types/index.js';
import type { Data, DocumentSlots, FormState } from '../types.js';
import type { InitPageResult, ViewTypes } from './index.js';
export type EditViewProps = {
    readonly collectionSlug?: string;
    readonly globalSlug?: string;
};
/**
 * Properties specific to the versions view
 */
export type RenderDocumentVersionsProperties = {
    /**
     * @default false
     */
    disableGutter?: boolean;
    /**
     * Use createdAt cell that appends params to the url on version selection instead of redirecting user
     * @default false
     */
    useVersionDrawerCreatedAtCell?: boolean;
};
export type DocumentViewServerPropsOnly = {
    doc: Data;
    hasPublishedDoc: boolean;
    initPageResult: InitPageResult;
    routeSegments: string[];
    versions?: RenderDocumentVersionsProperties;
} & ServerProps;
export type DocumentViewServerProps = DocumentViewClientProps & DocumentViewServerPropsOnly;
export type DocumentViewClientProps = {
    documentSubViewType: DocumentSubViewTypes;
    formState: FormState;
    viewType: ViewTypes;
} & DocumentSlots;
/**
 * @todo: This should be renamed to `DocumentSubViewType` (singular)
 */
export type DocumentSubViewTypes = 'api' | 'default' | 'version' | 'versions';
export type DocumentTabServerPropsOnly = {
    readonly apiURL?: string;
    readonly collectionConfig?: SanitizedCollectionConfig;
    readonly globalConfig?: SanitizedGlobalConfig;
    readonly permissions: SanitizedPermissions;
    readonly req: PayloadRequest;
} & ServerProps;
export type DocumentTabClientProps = {
    path: string;
};
export type DocumentTabServerProps = DocumentTabClientProps & DocumentTabServerPropsOnly;
export type DocumentTabCondition = (args: {
    collectionConfig: SanitizedCollectionConfig;
    /**
     * @deprecated: Use `req.payload.config` instead. This will be removed in v4.
     */
    config: SanitizedConfig;
    globalConfig: SanitizedGlobalConfig;
    permissions: SanitizedPermissions;
    req: PayloadRequest;
}) => boolean;
export type DocumentTabConfig = {
    readonly Component?: DocumentTabComponent;
    readonly condition?: DocumentTabCondition;
    readonly href?: ((args: {
        apiURL: string;
        collection: SanitizedCollectionConfig;
        global: SanitizedGlobalConfig;
        id?: string;
        routes: SanitizedConfig['routes'];
    }) => string) | string;
    readonly isActive?: ((args: {
        href: string;
    }) => boolean) | boolean;
    readonly label?: ((args: {
        t: (key: string) => string;
    }) => string) | string;
    readonly newTab?: boolean;
    /**
     * Sets the order to render the tab in the admin panel
     * Recommended to use increments of 100 (e.g. 0, 100, 200)
     */
    readonly order?: number;
    readonly Pill?: PayloadComponent;
};
/**
 * @todo: Remove this type as it's only used internally for the config (above)
 */
export type DocumentTabComponent = PayloadComponent<{
    path: string;
}>;
export type BeforeDocumentControlsClientProps = {};
export type BeforeDocumentControlsServerPropsOnly = {} & ServerProps;
export type BeforeDocumentControlsServerProps = BeforeDocumentControlsClientProps & BeforeDocumentControlsServerPropsOnly;
//# sourceMappingURL=document.d.ts.map