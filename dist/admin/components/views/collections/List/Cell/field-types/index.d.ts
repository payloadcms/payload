/// <reference types="react" />
declare const _default: {
    array: import("react").FC<{
        data: Record<string, unknown>;
        field: import("../../../../../../../fields/config/types").ArrayField;
    }>;
    blocks: import("react").FC<{
        data: any;
        field: import("../../../../../../../fields/config/types").BlockField;
    }>;
    code: ({ data }: {
        data: any;
    }) => JSX.Element;
    checkbox: ({ data }: {
        data: any;
    }) => JSX.Element;
    date: ({ data, field }: {
        data: any;
        field: any;
    }) => JSX.Element;
    json: ({ data }: {
        data: any;
    }) => JSX.Element;
    relationship: import("react").FC<{
        field: import("../../../../../../../fields/config/types").UIField | import("../../../../../../../fields/config/types").FieldAffectingData;
        data: unknown;
    }>;
    richText: ({ data }: {
        data: any;
    }) => JSX.Element;
    select: import("react").FC<{
        data: any;
        field: import("../../../../../../../fields/config/types").SelectField;
    }>;
    radio: import("react").FC<{
        data: any;
        field: import("../../../../../../../fields/config/types").SelectField;
    }>;
    textarea: ({ data }: {
        data: any;
    }) => JSX.Element;
    upload: import("react").FC<{
        field: import("../../../../../../../fields/config/types").UIField | import("../../../../../../../fields/config/types").FieldAffectingData;
        data: unknown;
    }>;
    File: ({ rowData, data, collection }: {
        rowData: any;
        data: any;
        collection: any;
    }) => JSX.Element;
};
export default _default;
