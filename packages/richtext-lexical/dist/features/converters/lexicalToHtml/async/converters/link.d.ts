import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js';
import type { HTMLConvertersAsync, HTMLPopulateFn } from '../types.js';
export declare const LinkHTMLConverterAsync: (args: {
    internalDocToHref?: (args: {
        linkNode: SerializedLinkNode;
        populate?: HTMLPopulateFn;
    }) => Promise<string> | string;
}) => HTMLConvertersAsync<SerializedAutoLinkNode | SerializedLinkNode>;
//# sourceMappingURL=link.d.ts.map