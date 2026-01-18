import type { StaticDescription, StaticLabel } from 'payload';
import type { Currency } from '../../types/index.js';
interface Props {
    currency?: Currency;
    description?: StaticDescription;
    disabled?: boolean;
    error?: string;
    id?: string;
    label?: StaticLabel;
    path: string;
    placeholder?: string;
    readOnly?: boolean;
    supportedCurrencies: Currency[];
}
export declare const FormattedInput: React.FC<Props>;
export {};
//# sourceMappingURL=FormattedInput.d.ts.map