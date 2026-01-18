import { createOperation } from './create.js';
export const duplicateOperation = async (incomingArgs)=>{
    const { id, ...args } = incomingArgs;
    return createOperation({
        ...args,
        data: incomingArgs?.data || {},
        duplicateFromID: id
    });
};

//# sourceMappingURL=duplicate.js.map