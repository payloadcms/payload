import type { I18n } from '@payloadcms/translations';
import type { BasePayload, Config, LanguageOptions, TypedUser } from 'payload';
import React from 'react';
import './index.scss';
export declare const Settings: React.FC<{
    readonly className?: string;
    readonly i18n: I18n;
    readonly languageOptions: LanguageOptions;
    readonly payload: BasePayload;
    readonly theme: Config['admin']['theme'];
    readonly user?: TypedUser;
}>;
//# sourceMappingURL=index.d.ts.map