import type { AuthCollectionSlug, CollectionSlug, GlobalSlug, JsonObject, PayloadTypesShape, SelectType, Sort, TransformDataWithSelect, TypeWithID, Where } from 'payload';
export type DataFromCollectionSlug<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = T['collections'][TSlug];
export type DataFromAuthSlug<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = T['collections'][CollectionSlug<T> & TSlug];
export type DataFromGlobalSlug<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>> = T['globals'][TSlug];
export type SelectFromCollectionSlug<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = SelectType & T['collectionsSelect'][TSlug];
export type SelectFromGlobalSlug<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>> = SelectType & T['globalsSelect'][TSlug];
export type TransformCollectionWithSelect<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect> = TSelect extends SelectType ? TransformDataWithSelect<(JsonObject & TypeWithID) & T['collections'][TSlug], TSelect> : T['collections'][TSlug];
export type TransformGlobalWithSelect<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>, TSelect> = TSelect extends SelectType ? TransformDataWithSelect<JsonObject & T['globals'][TSlug], TSelect> : T['globals'][TSlug];
type SystemFields = 'createdAt' | 'id' | 'sizes' | 'updatedAt';
export type RequiredDataFromCollection<TData> = Omit<TData, SystemFields> & Partial<Pick<Record<SystemFields, unknown> & TData, SystemFields>>;
export type RequiredDataFromCollectionSlug<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = RequiredDataFromCollection<T['collections'][TSlug]>;
export type JoinQuery<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = T['collectionsJoins'][TSlug] extends Record<string, string> ? false | Partial<{
    [K in keyof T['collectionsJoins'][TSlug]]: {
        count?: boolean;
        limit?: number;
        page?: number;
        sort?: Sort;
        where?: Where;
    } | false;
}> : never;
export type PopulateType<T extends PayloadTypesShape> = Partial<T['collectionsSelect']>;
export type IDType<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = (T['collections'][TSlug] & TypeWithID)['id'];
export type BulkOperationResult<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect> = {
    docs: TransformCollectionWithSelect<T, TSlug, TSelect>[];
    errors: {
        id: IDType<T, TSlug>;
        message: string;
    }[];
};
export {};
//# sourceMappingURL=types.d.ts.map