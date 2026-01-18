import type { Validate } from 'payload';
import React from 'react';
export type LoginFieldProps = {
    readonly required?: boolean;
    readonly type: 'email' | 'emailOrUsername' | 'username';
    readonly validate?: Validate;
};
export declare const LoginField: React.FC<LoginFieldProps>;
//# sourceMappingURL=index.d.ts.map