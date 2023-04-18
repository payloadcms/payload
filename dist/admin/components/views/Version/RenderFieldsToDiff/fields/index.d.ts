/// <reference types="react" />
declare const _default: {
    text: import("react").FC<import("./types").Props>;
    textarea: import("react").FC<import("./types").Props>;
    number: import("react").FC<import("./types").Props>;
    email: import("react").FC<import("./types").Props>;
    code: import("react").FC<import("./types").Props>;
    json: import("react").FC<import("./types").Props>;
    checkbox: import("react").FC<import("./types").Props>;
    radio: import("react").FC<import("./types").Props>;
    row: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").FieldWithSubFields;
    }>;
    collapsible: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").FieldWithSubFields;
    }>;
    group: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").FieldWithSubFields;
    }>;
    array: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").BlockField | import("../../../../../../fields/config/types").ArrayField;
    }>;
    blocks: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").BlockField | import("../../../../../../fields/config/types").ArrayField;
    }>;
    date: import("react").FC<import("./types").Props>;
    select: import("react").FC<import("./types").Props>;
    richText: import("react").FC<import("./types").Props>;
    relationship: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").RelationshipField;
    }>;
    upload: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").RelationshipField;
    }>;
    point: import("react").FC<import("./types").Props>;
    tabs: import("react").FC<import("./types").Props & {
        field: import("../../../../../../fields/config/types").TabsField;
    }>;
};
export default _default;
