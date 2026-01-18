import type { LexicalNode } from 'lexical';
import type { PayloadRequest } from 'payload';
import { type I18nClient } from '@payloadcms/translations';
import './index.scss';
import type { HTMLConvertersAsync } from '../../../../features/converters/lexicalToHtml/async/types.js';
export declare const UnknownDiffHTMLConverterAsync: (args: {
    i18n: I18nClient;
    req: PayloadRequest;
}) => HTMLConvertersAsync<LexicalNode>;
//# sourceMappingURL=index.d.ts.map