import { docAccessOperationGlobal, isolateObjectProperty } from 'payload';
export function docAccessResolver(global) {
    async function resolver(_, context) {
        return docAccessOperationGlobal({
            globalConfig: global,
            req: isolateObjectProperty(context.req, 'transactionID')
        });
    }
    return resolver;
}

//# sourceMappingURL=docAccess.js.map