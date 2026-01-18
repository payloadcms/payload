import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js';
import type { JSXConverters } from '../types.js';
export declare const LinkJSXConverter: (args: {
    internalDocToHref?: (args: {
        linkNode: SerializedLinkNode;
    }) => string;
}) => JSXConverters<SerializedAutoLinkNode | SerializedLinkNode>;
//# sourceMappingURL=link.d.ts.map