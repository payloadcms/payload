import { isolateObjectProperty, unlockOperation } from 'payload';
export function unlock(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            data: {
                email: args.email,
                username: args.username
            },
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await unlockOperation(options);
        return result;
    }
    return resolver;
}

//# sourceMappingURL=unlock.js.map