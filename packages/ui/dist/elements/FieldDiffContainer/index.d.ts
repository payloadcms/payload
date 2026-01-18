import type { LabelFunction, StaticLabel } from 'payload';
import './index.scss';
import { type I18nClient } from '@payloadcms/translations';
export declare const FieldDiffContainer: React.FC<{
    className?: string;
    From: React.ReactNode;
    i18n: I18nClient;
    label: {
        label?: false | LabelFunction | StaticLabel;
        locale?: string;
    };
    nestingLevel?: number;
    To: React.ReactNode;
}>;
//# sourceMappingURL=index.d.ts.map