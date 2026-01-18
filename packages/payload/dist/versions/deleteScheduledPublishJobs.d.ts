import type { PayloadRequest } from '../types/index.js';
import { type Payload } from '../index.js';
type Args = {
    id?: number | string;
    payload: Payload;
    req?: PayloadRequest;
    slug: string;
};
export declare const deleteScheduledPublishJobs: ({ id, slug, payload, req, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=deleteScheduledPublishJobs.d.ts.map