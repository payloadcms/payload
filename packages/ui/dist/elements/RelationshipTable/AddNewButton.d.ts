import type { I18nClient } from '@payloadcms/translations';
import type { ClientCollectionConfig, SanitizedPermissions } from 'payload';
import type { Props as ButtonProps } from '../../elements/Button/types.js';
export declare const AddNewButton: ({ allowCreate, baseClass, buttonStyle, className, collections, i18n, icon, label, onClick, permissions, relationTo, }: {
    allowCreate: boolean;
    baseClass: string;
    buttonStyle?: ButtonProps["buttonStyle"];
    className?: string;
    collections: ClientCollectionConfig[];
    i18n: I18nClient;
    icon?: ButtonProps["icon"];
    label: string;
    onClick: (selectedCollection?: string) => void;
    permissions: SanitizedPermissions;
    relationTo: string | string[];
}) => import("react").JSX.Element;
//# sourceMappingURL=AddNewButton.d.ts.map