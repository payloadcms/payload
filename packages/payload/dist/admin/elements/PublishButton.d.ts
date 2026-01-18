import type { ServerProps } from '../../config/types.js';
export type PublishButtonClientProps = {
    label?: string;
};
export type PublishButtonServerPropsOnly = {} & ServerProps;
export type PublishButtonServerProps = PublishButtonClientProps & PublishButtonServerPropsOnly;
//# sourceMappingURL=PublishButton.d.ts.map