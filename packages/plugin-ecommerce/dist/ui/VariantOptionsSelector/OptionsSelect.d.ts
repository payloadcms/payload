import type { SelectFieldClient } from 'payload';
type Props = {
    field: Omit<SelectFieldClient, 'type'>;
    label: string;
    options: {
        label: string;
        value: number | string;
    }[];
    path: string;
};
export declare const OptionsSelect: React.FC<Props>;
export {};
//# sourceMappingURL=OptionsSelect.d.ts.map