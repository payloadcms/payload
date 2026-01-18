import type { Data, Field as FieldSchema, PayloadRequest, SelectMode, SelectType, TypedUser } from 'payload';
type Args = {
    data: Data;
    fields: FieldSchema[];
    id?: number | string;
    locale: string | undefined;
    req: PayloadRequest;
    select?: SelectType;
    selectMode?: SelectMode;
    siblingData: Data;
    user: TypedUser;
};
export declare const calculateDefaultValues: ({ id, data, fields, locale, req, select, selectMode, user, }: Args) => Promise<Data>;
export {};
//# sourceMappingURL=index.d.ts.map