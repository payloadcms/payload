import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Field } from '../../../../fields/config/types';
import { Operator, Where } from '../../../../types';
export type Props = {
    collection: SanitizedCollectionConfig;
    handleChange?: (where: Where) => void;
    modifySearchQuery?: boolean;
};
export type FieldCondition = {
    label: string;
    value: string;
    operators: {
        label: string;
        value: Operator;
    }[];
    component?: string;
    props: Field;
};
export type Relation = 'and' | 'or';
export type ADD = {
    type: 'add';
    field: string;
    relation?: Relation;
    andIndex?: number;
    orIndex?: number;
};
export type REMOVE = {
    type: 'remove';
    andIndex: number;
    orIndex: number;
};
export type UPDATE = {
    type: 'update';
    andIndex: number;
    orIndex: number;
    operator?: string;
    field?: string;
    value?: unknown;
};
export type Action = ADD | REMOVE | UPDATE;
export type State = {
    or: Where[];
};
