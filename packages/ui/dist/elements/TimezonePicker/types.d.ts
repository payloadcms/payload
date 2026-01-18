import type { SelectFieldClient } from 'payload';
export type Props = {
    id: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    required?: boolean;
    selectedTimezone?: string;
} & Pick<SelectFieldClient, 'options'>;
//# sourceMappingURL=types.d.ts.map