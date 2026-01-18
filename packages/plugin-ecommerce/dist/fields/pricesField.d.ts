import type { GroupField } from 'payload';
import type { CurrenciesConfig } from '../types/index.js';
type Props = {
    /**
     * Use this to specify a path for the condition.
     */
    conditionalPath?: string;
    currenciesConfig: CurrenciesConfig;
};
export declare const pricesField: (props: Props) => GroupField[];
export {};
//# sourceMappingURL=pricesField.d.ts.map