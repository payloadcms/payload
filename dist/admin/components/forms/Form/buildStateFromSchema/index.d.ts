import type { TFunction } from 'i18next';
import { User } from '../../../../../auth';
import { Field as FieldSchema } from '../../../../../fields/config/types';
import { Fields, Data } from '../types';
type Args = {
    fieldSchema: FieldSchema[];
    data?: Data;
    siblingData?: Data;
    user?: User;
    id?: string | number;
    operation?: 'create' | 'update';
    locale: string;
    t: TFunction;
};
declare const buildStateFromSchema: (args: Args) => Promise<Fields>;
export default buildStateFromSchema;
