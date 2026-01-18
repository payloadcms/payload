import { type Column, type SQL } from 'drizzle-orm';
type OperatorKeys = 'and' | 'contains' | 'equals' | 'exists' | 'greater_than' | 'greater_than_equal' | 'in' | 'isNull' | 'less_than' | 'less_than_equal' | 'like' | 'not_equals' | 'not_in' | 'not_like' | 'or';
export type Operators = Record<OperatorKeys, (column: Column, value: unknown) => SQL>;
export declare const operatorMap: Operators;
export {};
//# sourceMappingURL=operatorMap.d.ts.map