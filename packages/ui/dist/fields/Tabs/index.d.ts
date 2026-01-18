import type { ClientComponentProps } from 'payload';
import React from 'react';
import { TabsProvider } from './provider.js';
import './index.scss';
export { TabsProvider };
export declare const TabsField: React.FC<import("payload").FieldPaths & {
    readonly field: Omit<import("payload").TabsFieldClient, "type"> & Partial<Pick<import("payload").TabsFieldClient, "type">>;
} & Omit<ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map