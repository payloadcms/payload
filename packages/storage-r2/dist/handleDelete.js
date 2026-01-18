import path from 'path';
export const getHandleDelete = ({ bucket })=>{
    return async ({ doc: { prefix = '' }, filename })=>{
        await bucket.delete(path.posix.join(prefix, filename));
    };
};

//# sourceMappingURL=handleDelete.js.map