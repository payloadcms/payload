import type { CollectionConfig } from '../../collections/config/types.js';
import type { SanitizedConfig } from '../../config/types.js';
import type { Job } from '../../index.js';
export declare const jobsCollectionSlug = "payload-jobs";
export declare const getDefaultJobsCollection: (jobsConfig: SanitizedConfig['jobs']) => CollectionConfig;
export declare function jobAfterRead({ config, doc }: {
    config: SanitizedConfig;
    doc: Job;
}): Job;
//# sourceMappingURL=collection.d.ts.map