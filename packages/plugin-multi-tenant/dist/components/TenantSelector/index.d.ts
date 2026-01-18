import type { ServerProps } from 'payload';
import type { MultiTenantPluginConfig } from '../../types.js';
type Props = {
    enabledSlugs: string[];
    label: MultiTenantPluginConfig['tenantSelectorLabel'];
} & ServerProps;
export declare const TenantSelector: (props: Props) => import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map