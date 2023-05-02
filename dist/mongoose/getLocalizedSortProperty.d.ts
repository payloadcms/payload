import { Config } from '../config/types';
import { Field } from '../fields/config/types';
type Args = {
    segments: string[];
    config: Config;
    fields: Field[];
    locale: string;
    result?: string;
};
export declare const getLocalizedSortProperty: ({ segments: incomingSegments, config, fields: incomingFields, locale, result: incomingResult, }: Args) => string;
export {};
