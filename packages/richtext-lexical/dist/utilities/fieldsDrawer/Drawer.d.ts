import type { ClientField, Data, FormState, JsonObject } from 'payload';
import React from 'react';
export type FieldsDrawerProps = {
    readonly className?: string;
    readonly data?: Data;
    readonly drawerSlug: string;
    readonly drawerTitle?: string;
    readonly featureKey: string;
    readonly fieldMapOverride?: ClientField[];
    readonly handleDrawerSubmit: (fields: FormState, data: JsonObject) => void;
    readonly schemaFieldsPathOverride?: string;
    readonly schemaPath: string;
    readonly schemaPathSuffix?: string;
};
/**
 * This FieldsDrawer component can be used to easily create a Drawer that contains a form with fields within your feature.
 * The fields are taken directly from the schema map based on your `featureKey` and `schemaPathSuffix`. Thus, this can only
 * be used if you provide your field schema inside the `generateSchemaMap` prop of your feature.server.ts.
 */
export declare const FieldsDrawer: React.FC<FieldsDrawerProps>;
//# sourceMappingURL=Drawer.d.ts.map