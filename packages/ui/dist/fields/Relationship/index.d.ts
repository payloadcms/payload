import React from 'react';
import { RelationshipInput } from './Input.js';
import './index.scss';
export { RelationshipInput };
export declare const RelationshipField: React.FC<{
    readonly path: string;
    readonly validate?: import("payload").RelationshipFieldValidation;
} & {
    readonly field: (Omit<import("payload").PolymorphicRelationshipFieldClient, "type"> & Partial<Pick<import("payload").PolymorphicRelationshipFieldClient, "type">>) | (Omit<import("payload").SingleRelationshipFieldClient, "type"> & Partial<Pick<import("payload").SingleRelationshipFieldClient, "type">>);
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map