import type { PayloadRequest } from 'payload';
import { type I18nClient } from '@payloadcms/translations';
import './index.scss';
import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js';
import type { SerializedUploadNode } from '../../../../nodeTypes.js';
export declare const UploadDiffHTMLConverterAsync: (args: {
    i18n: I18nClient;
    req: PayloadRequest;
}) => HTMLConvertersAsync<SerializedUploadNode>;
//# sourceMappingURL=index.d.ts.map