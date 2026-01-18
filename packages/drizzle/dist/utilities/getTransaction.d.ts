import type { PayloadRequest } from 'payload';
import type { DrizzleAdapter } from '../types.js';
/**
 * Returns current db transaction instance from req or adapter.drizzle itself
 *
 * If a transaction session doesn't exist (e.g., it was already committed/rolled back),
 * falls back to the default adapter.drizzle instance to prevent errors.
 */
export declare const getTransaction: <T extends DrizzleAdapter = DrizzleAdapter>(adapter: T, req?: Partial<PayloadRequest>) => Promise<T["drizzle"]>;
//# sourceMappingURL=getTransaction.d.ts.map