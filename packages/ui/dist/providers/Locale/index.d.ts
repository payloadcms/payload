import type { Locale } from 'payload';
import React from 'react';
export declare const LocaleLoadingContext: React.Context<{
    localeIsLoading: boolean;
    setLocaleIsLoading: (_: boolean) => any;
}>;
export declare const LocaleProvider: React.FC<{
    children?: React.ReactNode;
    locale?: Locale['code'];
}>;
export declare const useLocaleLoading: () => {
    localeIsLoading: boolean;
    setLocaleIsLoading: (_: boolean) => any;
};
/**
 * TODO: V4
 * The return type of the `useLocale` hook will change in v4. It will return `null | Locale` instead of `false | {} | Locale`.
 */
export declare const useLocale: () => Locale;
//# sourceMappingURL=index.d.ts.map