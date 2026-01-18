import type { PayloadComponent, SanitizedCollectionConfig, SanitizedCollectionPermission, SanitizedConfig, SanitizedGlobalConfig, SanitizedGlobalPermission } from 'payload';
import type React from 'react';
import type { ViewToRender } from './index.js';
export type ViewFromConfig<TProps extends object> = {
    Component?: React.FC<TProps>;
    ComponentConfig?: PayloadComponent<TProps>;
};
export declare const getDocumentView: ({ collectionConfig, config, docPermissions, globalConfig, routeSegments, }: {
    collectionConfig?: SanitizedCollectionConfig;
    config: SanitizedConfig;
    docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission;
    globalConfig?: SanitizedGlobalConfig;
    routeSegments: string[];
}) => {
    View: ViewToRender;
    viewKey: string;
} | null;
//# sourceMappingURL=getDocumentView.d.ts.map