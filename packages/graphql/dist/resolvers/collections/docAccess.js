import { docAccessOperation, isolateObjectProperty } from 'payload';
export function docAccessResolver(collection) {
    async function resolver(_, args, context) {
        return docAccessOperation({
            id: args.id,
            collection,
            req: isolateObjectProperty(context.req, 'transactionID')
        });
    }
    return resolver;
}

//# sourceMappingURL=docAccess.js.map