import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import type { RichTextField, ValidateOptions } from 'payload';
import type { NodeValidation } from '../features/typesServer.js';
export declare function validateNodes({ nodes, nodeValidations, validation: validationFromProps, }: {
    nodes: SerializedLexicalNode[];
    nodeValidations: Map<string, Array<NodeValidation>>;
    validation: {
        options: ValidateOptions<unknown, unknown, RichTextField, SerializedEditorState>;
        value: SerializedEditorState;
    };
}): Promise<string | true>;
//# sourceMappingURL=validateNodes.d.ts.map