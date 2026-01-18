import type { NumberFieldServerProps } from 'payload';
import './index.css';
import type { CurrenciesConfig, Currency } from '../../types/index.js';
type Props = {
    currenciesConfig: CurrenciesConfig;
    currency?: Currency;
    path: string;
} & NumberFieldServerProps;
export declare const PriceInput: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map