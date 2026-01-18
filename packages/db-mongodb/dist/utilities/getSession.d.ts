import type { ClientSession } from 'mongoose';
import type { PayloadRequest } from 'payload';
import type { MongooseAdapter } from '../index.js';
/**
 * returns the session belonging to the transaction of the req.session if exists
 * @returns ClientSession
 */
export declare function getSession(db: MongooseAdapter, req?: Partial<PayloadRequest>): Promise<ClientSession | undefined>;
//# sourceMappingURL=getSession.d.ts.map