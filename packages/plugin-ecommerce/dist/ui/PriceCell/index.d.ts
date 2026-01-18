import type { DefaultCellComponentProps, TypedCollection } from 'payload';
import type { CurrenciesConfig, Currency } from '../../types/index.js';
type Props = {
    cellData?: number;
    currenciesConfig: CurrenciesConfig;
    currency?: Currency;
    path: string;
    rowData: Partial<TypedCollection['products']>;
} & DefaultCellComponentProps;
export declare const PriceCell: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map