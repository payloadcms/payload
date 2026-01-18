import { operationToHookOperation } from './types.js';
// Implementation
export async function buildBeforeOperation(operationArgs) {
    const { args, collection, operation } = operationArgs;
    let newArgs = args;
    if (args.collection.config.hooks?.beforeOperation?.length) {
        // TODO: v4 should not need this mapping
        // Map the operation to the hook operation type for backward compatibility
        const hookOperation = operationToHookOperation[operation];
        for (const hook of args.collection.config.hooks.beforeOperation){
            const hookResult = await hook({
                args: newArgs,
                collection,
                context: args.req.context,
                operation: hookOperation,
                req: args.req
            });
            if (hookResult !== undefined) {
                newArgs = hookResult;
            }
        }
    }
    return newArgs;
}

//# sourceMappingURL=buildBeforeOperation.js.map