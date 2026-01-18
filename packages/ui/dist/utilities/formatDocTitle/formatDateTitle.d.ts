import type { I18n, I18nClient } from '@payloadcms/translations';
export type FormatDateArgs = {
    date: Date | number | string | undefined;
    i18n: I18n<unknown, unknown> | I18nClient<unknown>;
    pattern: string;
    timezone?: string;
};
export declare const formatDate: ({ date, i18n, pattern, timezone }: FormatDateArgs) => string;
type FormatTimeToNowArgs = {
    date: Date | number | string | undefined;
    i18n: I18n<unknown, unknown> | I18nClient<unknown>;
};
export declare const formatTimeToNow: ({ date, i18n }: FormatTimeToNowArgs) => string;
export {};
//# sourceMappingURL=formatDateTitle.d.ts.map