import type { HTMLConverter, SerializedLexicalNodeWithParent } from './types.js';
export declare function serializeLexical(data?: any, submissionData?: any): Promise<string>;
export declare function convertLexicalNodesToHTML({ converters, lexicalNodes, parent, submissionData, }: {
    converters: HTMLConverter[];
    lexicalNodes: any[];
    parent: SerializedLexicalNodeWithParent;
    submissionData?: any;
}): Promise<string>;
//# sourceMappingURL=serializeLexical.d.ts.map