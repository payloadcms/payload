import type { RetryConfig } from '../config/types/taskTypes.js';
export declare function calculateBackoffWaitUntil({ retriesConfig, totalTried, }: {
    retriesConfig: number | RetryConfig;
    totalTried: number;
}): Date;
//# sourceMappingURL=calculateBackoffWaitUntil.d.ts.map