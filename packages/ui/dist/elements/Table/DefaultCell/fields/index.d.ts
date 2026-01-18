export declare const cellComponents: {
    array: import("react").FC<import("./Array/index.js").ArrayCellProps>;
    blocks: import("react").FC<import("./Blocks/index.js").BlocksCellProps>;
    checkbox: import("react").FC<import("payload").DefaultCellComponentProps<import("payload").CheckboxFieldClient>>;
    code: import("react").FC<import("./Code/index.js").CodeCellProps>;
    date: import("react").FC<import("payload").DefaultCellComponentProps<{
        accessor?: string;
    } & {
        admin?: import("payload").AdminClient & Pick<import("payload").DateField["admin"], "date" | "placeholder">;
        timezone?: ({
            required?: boolean;
            supportedTimezones?: import("payload").Timezone[];
        } & Pick<import("payload").TimezonesConfig, "defaultTimezone">) | true;
    } & import("payload").FieldBaseClient & Pick<import("payload").DateField, "type">>>;
    File: import("react").FC<import("./File/index.js").FileCellProps>;
    join: import("react").FC<import("./Relationship/index.js").RelationshipCellProps>;
    json: import("react").FC<import("payload").DefaultCellComponentProps<import("payload").JSONFieldClient>>;
    radio: import("react").FC<import("./Select/index.js").SelectCellProps>;
    relationship: import("react").FC<import("./Relationship/index.js").RelationshipCellProps>;
    select: import("react").FC<import("./Select/index.js").SelectCellProps>;
    textarea: import("react").FC<import("payload").DefaultCellComponentProps<import("payload").TextareaFieldClient>>;
    upload: import("react").FC<import("./Relationship/index.js").RelationshipCellProps>;
};
//# sourceMappingURL=index.d.ts.map