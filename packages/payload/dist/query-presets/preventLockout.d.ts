import type { Validate } from '../fields/config/types.js';
/**
 * Prevents "accidental lockouts" where a user makes an update that removes their own access to the preset.
 * This is effectively an access control function proxied through a `validate` function.
 * How it works:
 *   1. Creates a temporary record with the incoming data
 *   2. Attempts to read and update that record with the incoming user
 *   3. If either of those fail, throws an error to the user
 *   4. Once finished, prevents the temp record from persisting to the database
 */
export declare const preventLockout: Validate;
//# sourceMappingURL=preventLockout.d.ts.map