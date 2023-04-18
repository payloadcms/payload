import type { TFunction } from 'i18next';
import { User } from '../../../../../auth';
import { Field as FieldSchema } from '../../../../../fields/config/types';
import { Fields, Data } from '../types';
type Args = {
    state: Fields;
    fields: FieldSchema[];
    data: Data;
    fullData: Data;
    parentPassesCondition: boolean;
    path: string;
    user: User;
    locale: string;
    id: string | number;
    operation: 'create' | 'update';
    t: TFunction;
};
export declare const iterateFields: ({ fields, data, parentPassesCondition, path, fullData, user, locale, operation, id, state, t, }: Args) => Promise<void>;
export {};
