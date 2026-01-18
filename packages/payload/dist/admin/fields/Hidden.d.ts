import type { ClientFieldBase } from '../types.js';
type HiddenFieldBaseClientProps = {
    readonly disableModifyingForm?: false;
    readonly field?: never;
    readonly path: string;
    readonly value?: unknown;
};
export type HiddenFieldProps = HiddenFieldBaseClientProps & Pick<ClientFieldBase, 'forceRender' | 'schemaPath'>;
export {};
//# sourceMappingURL=Hidden.d.ts.map