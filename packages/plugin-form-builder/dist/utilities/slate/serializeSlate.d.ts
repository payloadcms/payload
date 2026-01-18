interface Node {
    bold?: boolean;
    children?: Node[];
    code?: boolean;
    italic?: boolean;
    text?: string;
    type?: string;
    url?: string;
}
export declare const serializeSlate: (children?: Node[], submissionData?: any) => string | undefined;
export {};
//# sourceMappingURL=serializeSlate.d.ts.map