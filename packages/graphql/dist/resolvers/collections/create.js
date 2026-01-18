import { createOperation, isolateObjectProperty } from 'payload';
export function createResolver(collection) {
    return async function resolver(_, args, context) {
        if (args.locale) {
            context.req.locale = args.locale;
        }
        const result = await createOperation({
            collection,
            data: args.data,
            depth: 0,
            draft: args.draft,
            req: isolateObjectProperty(context.req, 'transactionID')
        });
        return result;
    };
}

//# sourceMappingURL=create.js.map