import { ValidationError } from '../errors/index.js';
export const ensureUsernameOrEmail = ({ authOptions: { disableLocalStrategy, loginWithUsername }, collectionSlug, data, operation, originalDoc, req })=>{
    // neither username or email are required
    // and neither are provided
    // so we need to manually validate
    if (!disableLocalStrategy && loginWithUsername && !loginWithUsername.requireEmail && !loginWithUsername.requireUsername) {
        let missingFields = false;
        if (operation === 'create' && !data.email && !data.username) {
            missingFields = true;
        } else if (operation === 'update') {
            // prevent clearing both email and username
            if ('email' in data && !data.email && 'username' in data && !data.username) {
                missingFields = true;
            }
            // prevent clearing email if no username
            if ('email' in data && !data.email && !originalDoc.username && !data?.username) {
                missingFields = true;
            }
            // prevent clearing username if no email
            if ('username' in data && !data.username && !originalDoc.email && !data?.email) {
                missingFields = true;
            }
        }
        if (missingFields) {
            throw new ValidationError({
                collection: collectionSlug,
                errors: [
                    {
                        message: 'Username or email is required',
                        path: 'username'
                    },
                    {
                        message: 'Username or email is required',
                        path: 'email'
                    }
                ]
            }, req.t);
        }
    }
    return;
};

//# sourceMappingURL=ensureUsernameOrEmail.js.map