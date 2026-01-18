import type { ClientTranslationKeys, TFunction } from '@payloadcms/translations';
import * as React from 'react';
export type TranslationProps = {
    elements?: Record<string, React.FC<{
        children: React.ReactNode;
    }>>;
    i18nKey: ClientTranslationKeys;
    t: TFunction;
    variables?: Record<string, unknown>;
};
export declare const Translation: React.FC<TranslationProps>;
//# sourceMappingURL=index.d.ts.map