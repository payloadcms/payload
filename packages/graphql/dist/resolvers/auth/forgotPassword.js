import { forgotPasswordOperation, isolateObjectProperty } from 'payload';
export function forgotPassword(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            data: {
                email: args.email,
                username: args.username
            },
            disableEmail: args.disableEmail,
            expiration: args.expiration,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        await forgotPasswordOperation(options);
        return true;
    }
    return resolver;
}

//# sourceMappingURL=forgotPassword.js.map