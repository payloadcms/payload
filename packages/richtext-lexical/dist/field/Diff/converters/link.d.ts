import type { HTMLConvertersAsync, HTMLPopulateFn } from '../../../features/converters/lexicalToHtml/async/types.js';
import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../nodeTypes.js';
export declare const LinkDiffHTMLConverterAsync: (args: {
    internalDocToHref?: (args: {
        linkNode: SerializedLinkNode;
        populate?: HTMLPopulateFn;
    }) => Promise<string> | string;
}) => HTMLConvertersAsync<SerializedAutoLinkNode | SerializedLinkNode>;
//# sourceMappingURL=link.d.ts.map