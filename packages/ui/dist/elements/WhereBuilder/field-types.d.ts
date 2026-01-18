import type { ClientField } from 'payload';
export declare const arrayOperators: {
    label: string;
    value: string;
}[];
export declare const fieldTypeConditions: {
    [key: string]: {
        component: string;
        operators: {
            label: string;
            value: string;
        }[];
    };
};
export declare const getValidFieldOperators: ({ field, operator, }: {
    field: ClientField;
    operator?: string;
}) => {
    validOperator: string;
    validOperators: {
        label: string;
        value: string;
    }[];
};
//# sourceMappingURL=field-types.d.ts.map