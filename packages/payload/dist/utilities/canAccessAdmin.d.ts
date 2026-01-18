import type { PayloadRequest } from '../types/index.js';
/**
 * Protects admin-only routes, server functions, etc.
 * The requesting user must either:
 * a. pass the `access.admin` function on the `users` collection, if defined
 * b. match the `config.admin.user` property on the Payload config
 * c. if no user is present, and there are no users in the system, allow access (for first user creation)
 * @throws {Error} Throws an `Unauthorized` error if access is denied that can be explicitly caught
 */
export declare const canAccessAdmin: ({ req }: {
    req: PayloadRequest;
}) => Promise<void>;
//# sourceMappingURL=canAccessAdmin.d.ts.map