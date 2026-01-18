import type { FileData, PayloadRequest, TypeWithID, UploadField, UploadFieldDiffServerComponent } from 'payload';
import { type I18nClient } from '@payloadcms/translations';
import './index.scss';
import React from 'react';
type NonPolyUploadDoc = (FileData & TypeWithID) | number | string;
type PolyUploadDoc = {
    relationTo: string;
    value: (FileData & TypeWithID) | number | string;
};
type UploadDoc = NonPolyUploadDoc | PolyUploadDoc;
export declare const Upload: UploadFieldDiffServerComponent;
export declare const HasManyUploadDiff: React.FC<{
    field: UploadField;
    i18n: I18nClient;
    locale: string;
    nestingLevel?: number;
    polymorphic: boolean;
    req: PayloadRequest;
    valueFrom: Array<UploadDoc>;
    valueTo: Array<UploadDoc>;
}>;
export declare const SingleUploadDiff: React.FC<{
    field: UploadField;
    i18n: I18nClient;
    locale: string;
    nestingLevel?: number;
    polymorphic: boolean;
    req: PayloadRequest;
    valueFrom: UploadDoc;
    valueTo: UploadDoc;
}>;
export {};
//# sourceMappingURL=index.d.ts.map