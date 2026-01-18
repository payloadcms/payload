import type { CollectionSlug, FormState } from 'payload';
import type { UploadHandlersContext } from '../../../providers/UploadHandlers/index.js';
export declare function createFormData(formState: FormState, overrides: Record<string, any>, collectionSlug: CollectionSlug, uploadHandler: ReturnType<UploadHandlersContext['getUploadHandler']>): Promise<FormData>;
//# sourceMappingURL=createFormData.d.ts.map