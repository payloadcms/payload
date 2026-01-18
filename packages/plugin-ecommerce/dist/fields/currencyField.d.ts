import type { SelectField } from 'payload';
import type { CurrenciesConfig } from '../types/index.js';
type Props = {
    currenciesConfig: CurrenciesConfig;
    overrides?: Partial<SelectField>;
};
export declare const currencyField: (props: Props) => SelectField;
export {};
//# sourceMappingURL=currencyField.d.ts.map