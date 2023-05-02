import { RichTextField } from '../config/types';
import { PayloadRequest } from '../../express/types';
type Args = {
    currentDepth?: number;
    depth: number;
    field: RichTextField;
    overrideAccess?: boolean;
    req: PayloadRequest;
    siblingDoc: Record<string, unknown>;
    showHiddenFields: boolean;
};
type RecurseRichTextArgs = {
    children: unknown[];
    overrideAccess: boolean;
    depth: number;
    currentDepth: number;
    field: RichTextField;
    req: PayloadRequest;
    promises: Promise<void>[];
    showHiddenFields: boolean;
};
export declare const recurseRichText: ({ req, children, overrideAccess, depth, currentDepth, field, promises, showHiddenFields, }: RecurseRichTextArgs) => void;
declare const richTextRelationshipPromise: ({ currentDepth, depth, field, overrideAccess, req, siblingDoc, showHiddenFields, }: Args) => Promise<void>;
export default richTextRelationshipPromise;
