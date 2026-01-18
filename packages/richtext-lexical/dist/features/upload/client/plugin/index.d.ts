import type { LexicalCommand } from 'lexical';
import type { PluginComponent } from '../../../typesClient.js';
import type { UploadData } from '../../server/nodes/UploadNode.js';
import type { UploadFeaturePropsClient } from '../index.js';
export type InsertUploadPayload = Readonly<Omit<UploadData, 'id'> & Partial<Pick<UploadData, 'id'>>>;
declare global {
    interface DragEvent {
        rangeOffset?: number;
        rangeParent?: Node;
    }
}
export declare const INSERT_UPLOAD_COMMAND: LexicalCommand<InsertUploadPayload>;
export declare const UploadPlugin: PluginComponent<UploadFeaturePropsClient>;
//# sourceMappingURL=index.d.ts.map