import type { ClientCollectionConfig, FieldLabelClientProps, FilterOptionsResult, StaticDescription, StaticLabel, UploadFieldClient, UploadField as UploadFieldType, ValueWithRelation } from 'payload';
import type { MarkOptional } from 'ts-essentials';
import React from 'react';
import './index.scss';
export declare const baseClass = "upload";
export type UploadInputProps = {
    readonly AfterInput?: React.ReactNode;
    readonly allowCreate?: boolean;
    /**
     * Controls the visibility of the "Create new collection" button
     */
    readonly api?: string;
    readonly BeforeInput?: React.ReactNode;
    readonly className?: string;
    readonly collection?: ClientCollectionConfig;
    readonly customUploadActions?: React.ReactNode[];
    readonly Description?: React.ReactNode;
    readonly description?: StaticDescription;
    readonly displayPreview?: boolean;
    readonly Error?: React.ReactNode;
    readonly filterOptions?: FilterOptionsResult;
    readonly hasMany?: boolean;
    readonly hideRemoveFile?: boolean;
    readonly isSortable?: boolean;
    readonly Label?: React.ReactNode;
    readonly label?: StaticLabel;
    readonly labelProps?: FieldLabelClientProps<MarkOptional<UploadFieldClient, 'type'>>;
    readonly localized?: boolean;
    readonly maxRows?: number;
    readonly onChange?: (e: any) => void;
    readonly path: string;
    readonly readOnly?: boolean;
    readonly relationTo: UploadFieldType['relationTo'];
    readonly required?: boolean;
    readonly serverURL?: string;
    readonly showError?: boolean;
    readonly style?: React.CSSProperties;
    readonly value?: (number | string)[] | number | string | ValueWithRelation | ValueWithRelation[];
};
export declare function UploadInput(props: UploadInputProps): React.JSX.Element;
//# sourceMappingURL=Input.d.ts.map