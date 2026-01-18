import type { MarkRequired } from 'ts-essentials';
import type { PayloadRequest } from '../types/index.js';
/**
 * complete a transaction calling adapter db.commitTransaction and delete the transactionID from req
 */
export declare function commitTransaction(req: MarkRequired<Partial<PayloadRequest>, 'payload'>): Promise<void>;
//# sourceMappingURL=commitTransaction.d.ts.map