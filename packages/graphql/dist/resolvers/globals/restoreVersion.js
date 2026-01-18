import { isolateObjectProperty, restoreVersionOperationGlobal } from 'payload';
export function restoreVersion(globalConfig) {
    return async function resolver(_, args, context) {
        const options = {
            id: args.id,
            depth: 0,
            draft: args.draft,
            globalConfig,
            req: isolateObjectProperty(context.req, 'transactionID')
        };
        const result = await restoreVersionOperationGlobal(options);
        return result;
    };
}

//# sourceMappingURL=restoreVersion.js.map