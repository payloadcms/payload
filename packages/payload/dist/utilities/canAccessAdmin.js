import { UnauthorizedError } from '../errors/UnauthorizedError.js';
/**
 * Protects admin-only routes, server functions, etc.
 * The requesting user must either:
 * a. pass the `access.admin` function on the `users` collection, if defined
 * b. match the `config.admin.user` property on the Payload config
 * c. if no user is present, and there are no users in the system, allow access (for first user creation)
 * @throws {Error} Throws an `Unauthorized` error if access is denied that can be explicitly caught
 */ export const canAccessAdmin = async ({ req })=>{
    const incomingUserSlug = req.user?.collection;
    const adminUserSlug = req.payload.config.admin.user;
    if (incomingUserSlug) {
        const adminAccessFn = req.payload.collections[incomingUserSlug]?.config.access?.admin;
        if (adminAccessFn) {
            const canAccess = await adminAccessFn({
                req
            });
            if (!canAccess) {
                throw new UnauthorizedError();
            }
        // Match the user collection to the global admin config
        } else if (adminUserSlug !== incomingUserSlug) {
            throw new UnauthorizedError();
        }
    } else {
        const hasUsers = await req.payload.find({
            collection: adminUserSlug,
            depth: 0,
            limit: 1,
            pagination: false
        });
        // If there are users, we should not allow access because of `/create-first-user`
        if (hasUsers.docs.length) {
            throw new UnauthorizedError();
        }
    }
};

//# sourceMappingURL=canAccessAdmin.js.map