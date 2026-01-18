import type { ServerProps } from '../../config/types.js';
export type SaveButtonClientProps = {
    label?: string;
};
export type SaveButtonServerPropsOnly = {} & ServerProps;
export type SaveButtonServerProps = SaveButtonClientProps & SaveButtonServerPropsOnly;
//# sourceMappingURL=SaveButton.d.ts.map