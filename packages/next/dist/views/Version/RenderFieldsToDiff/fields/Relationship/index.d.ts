import type { PayloadRequest, RelationshipField, RelationshipFieldDiffServerComponent, TypeWithID } from 'payload';
import { type I18nClient } from '@payloadcms/translations';
import './index.scss';
import React from 'react';
export type RelationshipValue = {
    relationTo: string;
    value: number | string | TypeWithID;
} | (number | string | TypeWithID);
export declare const Relationship: RelationshipFieldDiffServerComponent;
export declare const SingleRelationshipDiff: React.FC<{
    field: RelationshipField;
    i18n: I18nClient;
    locale: string;
    nestingLevel?: number;
    parentIsLocalized: boolean;
    polymorphic: boolean;
    req: PayloadRequest;
    valueFrom: RelationshipValue;
    valueTo: RelationshipValue;
}>;
//# sourceMappingURL=index.d.ts.map