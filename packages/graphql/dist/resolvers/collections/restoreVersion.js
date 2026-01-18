import { isolateObjectProperty, restoreVersionOperation } from 'payload';
export function restoreVersionResolver(collection) {
    async function resolver(_, args, context) {
        const options = {
            id: args.id,
            collection,
            depth: 0,
            draft: args.draft,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await restoreVersionOperation(options);
        return result;
    }
    return resolver;
}

//# sourceMappingURL=restoreVersion.js.map