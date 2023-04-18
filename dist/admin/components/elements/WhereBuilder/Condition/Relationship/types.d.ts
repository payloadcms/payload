import i18n from 'i18next';
import { RelationshipField } from '../../../../../../fields/config/types';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { PaginatedDocs } from '../../../../../../mongoose/types';
export type Props = {
    onChange: (val: unknown) => void;
    value: unknown;
} & RelationshipField;
export type Option = {
    label: string;
    value: string;
    relationTo?: string;
    options?: Option[];
};
type CLEAR = {
    type: 'CLEAR';
    required: boolean;
    i18n: typeof i18n;
};
type ADD = {
    type: 'ADD';
    data: PaginatedDocs<any>;
    relation: string;
    hasMultipleRelations: boolean;
    collection: SanitizedCollectionConfig;
    i18n: typeof i18n;
};
export type Action = CLEAR | ADD;
export type ValueWithRelation = {
    relationTo: string;
    value: string;
};
export type GetResults = (args: {
    lastFullyLoadedRelation?: number;
    lastLoadedPage?: number;
    search?: string;
}) => Promise<void>;
export {};
