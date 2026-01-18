import type { MarkRequired } from 'ts-essentials';
import type { PayloadRequest } from '../types/index.js';
/**
 * Starts a new transaction using the db adapter with a random id and then assigns it to the req.transaction
 * @returns true if beginning a transaction and false when req already has a transaction to use
 */
export declare function initTransaction(req: MarkRequired<Partial<PayloadRequest>, 'payload'>): Promise<boolean>;
//# sourceMappingURL=initTransaction.d.ts.map