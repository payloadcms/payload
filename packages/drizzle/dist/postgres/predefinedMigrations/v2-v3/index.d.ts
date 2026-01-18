import type { Payload, PayloadRequest } from 'payload';
type Args = {
    debug?: boolean;
    payload: Payload;
    req?: Partial<PayloadRequest>;
};
/**
 * Moves upload and relationship columns from the join table and into the tables while moving data
 * This is done in the following order:
 *    ADD COLUMNs
 *    -- manipulate data to move relationships to new columns
 *    ADD CONSTRAINTs
 *    NOT NULLs
 *    DROP TABLEs
 *    DROP CONSTRAINTs
 *    DROP COLUMNs
 * @param debug
 * @param payload
 * @param req
 */
export declare const migratePostgresV2toV3: ({ debug, payload, req }: Args) => Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map