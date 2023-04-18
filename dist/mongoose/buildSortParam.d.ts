import { Config } from '../config/types';
import { Field } from '../fields/config/types';
type Args = {
    sort: string;
    config: Config;
    fields: Field[];
    timestamps: boolean;
    locale: string;
};
export declare const buildSortParam: ({ sort, config, fields, timestamps, locale }: Args) => [string, string];
export {};
