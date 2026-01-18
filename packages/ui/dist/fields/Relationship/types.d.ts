import type { I18nClient } from '@payloadcms/translations';
import type { ClientCollectionConfig, ClientConfig, CollectionSlug, FilterOptionsResult, LabelFunction, StaticDescription, StaticLabel, ValueWithRelation } from 'payload';
export type Option = {
    allowEdit: boolean;
    label: string;
    options?: Option[];
    relationTo?: string;
    value: number | string;
};
export type OptionGroup = {
    label: string;
    options: Option[];
};
export type MonomorphicRelationValue = number | string;
export type Value = MonomorphicRelationValue | MonomorphicRelationValue[] | ValueWithRelation | ValueWithRelation[];
type CLEAR = {
    exemptValues?: ValueWithRelation | ValueWithRelation[];
    type: 'CLEAR';
};
type UPDATE = {
    collection: ClientCollectionConfig;
    config: ClientConfig;
    doc: any;
    i18n: I18nClient;
    type: 'UPDATE';
};
type ADD = {
    collection: ClientCollectionConfig;
    config: ClientConfig;
    docs: any[];
    i18n: I18nClient;
    ids?: (number | string)[];
    sort?: boolean;
    type: 'ADD';
};
type REMOVE = {
    collection: ClientCollectionConfig;
    config: ClientConfig;
    i18n: I18nClient;
    id: string;
    type: 'REMOVE';
};
export type Action = ADD | CLEAR | REMOVE | UPDATE;
export type HasManyValueUnion = {
    hasMany: false;
    value?: ValueWithRelation;
} | {
    hasMany: true;
    value?: ValueWithRelation[];
};
export type UpdateResults = (args: {
    filterOptions?: FilterOptionsResult;
    lastFullyLoadedRelation?: number;
    lastLoadedPage: Record<string, number>;
    onSuccess?: () => void;
    search?: string;
    sort?: boolean;
} & HasManyValueUnion) => void;
export type RelationshipInputProps = {
    readonly AfterInput?: React.ReactNode;
    readonly allowCreate?: boolean;
    readonly allowEdit?: boolean;
    readonly appearance?: 'drawer' | 'select';
    readonly BeforeInput?: React.ReactNode;
    readonly className?: string;
    readonly Description?: React.ReactNode;
    readonly description?: StaticDescription;
    readonly Error?: React.ReactNode;
    readonly filterOptions?: FilterOptionsResult;
    readonly formatDisplayedOptions?: (options: OptionGroup[]) => Option[] | OptionGroup[];
    readonly isSortable?: boolean;
    readonly Label?: React.ReactNode;
    readonly label?: StaticLabel;
    readonly localized?: boolean;
    readonly maxResultsPerRequest?: number;
    readonly maxRows?: number;
    readonly minRows?: number;
    readonly path: string;
    readonly placeholder?: LabelFunction | string;
    readonly readOnly?: boolean;
    readonly relationTo: string[];
    readonly required?: boolean;
    readonly showError?: boolean;
    readonly sortOptions?: Partial<Record<CollectionSlug, string>>;
    readonly style?: React.CSSProperties;
} & SharedRelationshipInputProps;
type SharedRelationshipInputProps = {
    readonly hasMany: false;
    readonly initialValue?: null | ValueWithRelation;
    readonly onChange: (value: ValueWithRelation) => void;
    readonly value?: null | ValueWithRelation;
} | {
    readonly hasMany: true;
    readonly initialValue?: null | ValueWithRelation[];
    readonly onChange: (value: ValueWithRelation[]) => void;
    readonly value?: null | ValueWithRelation[];
};
export {};
//# sourceMappingURL=types.d.ts.map