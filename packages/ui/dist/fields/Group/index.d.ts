import type { GroupFieldClientComponent } from 'payload';
import React from 'react';
import './index.scss';
import { GroupProvider, useGroup } from './provider.js';
export declare const GroupFieldComponent: GroupFieldClientComponent;
export { GroupProvider, useGroup };
export declare const GroupField: React.FC<import("payload").FieldPaths & {
    readonly field: (Omit<import("payload").UnnamedGroupFieldClient, "type"> & Partial<Pick<import("payload").UnnamedGroupFieldClient, "type">>) | (Omit<import("payload").NamedGroupFieldClient, "type"> & Partial<Pick<import("payload").NamedGroupFieldClient, "type">>);
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map