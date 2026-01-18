import type { NumberField } from 'payload';
import type { CurrenciesConfig, Currency } from '../types/index.js';
type Props = {
    currenciesConfig: CurrenciesConfig;
    /**
     * Use this specific currency for the field.
     */
    currency?: Currency;
    overrides?: Partial<NumberField>;
};
export declare const amountField: (props: Props) => NumberField;
export {};
//# sourceMappingURL=amountField.d.ts.map