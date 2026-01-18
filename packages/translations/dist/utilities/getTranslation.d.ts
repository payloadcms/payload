import type { JSX } from 'react';
import type { I18n, I18nClient, TFunction } from '../types.js';
type LabelType = (() => JSX.Element) | ((args: {
    i18n: I18nClient;
    t: TFunction;
}) => string) | JSX.Element | Record<string, string> | string;
export declare const getTranslation: <T extends LabelType>(label: T, i18n: Pick<I18n<any, any>, "fallbackLanguage" | "language" | "t">) => T extends JSX.Element ? JSX.Element : string;
export {};
//# sourceMappingURL=getTranslation.d.ts.map