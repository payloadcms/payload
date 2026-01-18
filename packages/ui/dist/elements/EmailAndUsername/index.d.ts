import type { TFunction } from '@payloadcms/translations';
import type { LoginWithUsernameOptions, SanitizedFieldPermissions } from 'payload';
import React from 'react';
import './index.scss';
type RenderEmailAndUsernameFieldsProps = {
    className?: string;
    loginWithUsername?: false | LoginWithUsernameOptions;
    operation?: 'create' | 'update';
    permissions?: {
        [fieldName: string]: SanitizedFieldPermissions;
    } | true;
    readOnly: boolean;
    t: TFunction;
};
export declare function EmailAndUsernameFields(props: RenderEmailAndUsernameFieldsProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map