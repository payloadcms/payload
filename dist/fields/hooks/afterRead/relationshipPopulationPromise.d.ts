import { PayloadRequest } from '../../../express/types';
import { RelationshipField, UploadField } from '../../config/types';
type PromiseArgs = {
    siblingDoc: Record<string, any>;
    field: RelationshipField | UploadField;
    depth: number;
    currentDepth: number;
    req: PayloadRequest;
    overrideAccess: boolean;
    showHiddenFields: boolean;
};
declare const relationshipPopulationPromise: ({ siblingDoc, field, depth, currentDepth, req, overrideAccess, showHiddenFields, }: PromiseArgs) => Promise<void>;
export default relationshipPopulationPromise;
