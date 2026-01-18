import type { ClientConfig, Column } from 'payload';
import { type I18nClient, type TFunction } from '@payloadcms/translations';
import type { UpcomingEvent } from './types.js';
type Args = {
    dateFormat: string;
    deleteHandler: (id: number | string) => void;
    docs: UpcomingEvent[];
    i18n: I18nClient;
    localization: ClientConfig['localization'];
    supportedTimezones: ClientConfig['admin']['timezones']['supportedTimezones'];
    t: TFunction;
};
export declare const buildUpcomingColumns: ({ dateFormat, deleteHandler, docs, i18n, localization, supportedTimezones, t, }: Args) => Column[];
export {};
//# sourceMappingURL=buildUpcomingColumns.d.ts.map