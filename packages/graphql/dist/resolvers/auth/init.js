import { initOperation, isolateObjectProperty } from 'payload';
export function init(collection) {
    async function resolver(_, args, context) {
        const options = {
            collection,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        return initOperation(options);
    }
    return resolver;
}

//# sourceMappingURL=init.js.map