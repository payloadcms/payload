import type { Data, Field, PayloadRequest, SelectMode, SelectType, TabAsField, TypedUser } from 'payload';
type Args<T> = {
    data: T;
    fields: (Field | TabAsField)[];
    id?: number | string;
    locale: string | undefined;
    req: PayloadRequest;
    select?: SelectType;
    selectMode?: SelectMode;
    siblingData: Data;
    user: TypedUser;
};
export declare const iterateFields: <T>({ id, data, fields, locale, req, select, selectMode, siblingData, user, }: Args<T>) => Promise<void>;
export {};
//# sourceMappingURL=iterateFields.d.ts.map