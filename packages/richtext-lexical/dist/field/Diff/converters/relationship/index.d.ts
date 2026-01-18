import type { PayloadRequest } from 'payload';
import { type I18nClient } from '@payloadcms/translations';
import './index.scss';
import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js';
import type { SerializedRelationshipNode } from '../../../../nodeTypes.js';
export declare const RelationshipDiffHTMLConverterAsync: (args: {
    i18n: I18nClient;
    req: PayloadRequest;
}) => HTMLConvertersAsync<SerializedRelationshipNode>;
//# sourceMappingURL=index.d.ts.map