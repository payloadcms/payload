import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js';
import type { HTMLConverters } from '../types.js';
export declare const LinkHTMLConverter: (args: {
    internalDocToHref?: (args: {
        linkNode: SerializedLinkNode;
    }) => string;
}) => HTMLConverters<SerializedAutoLinkNode | SerializedLinkNode>;
//# sourceMappingURL=link.d.ts.map