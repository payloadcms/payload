import { createLocalReq } from '../../../utilities/createLocalReq.js';
import { auth as authOperation } from '../auth.js';
export const authLocal = async (payload, options)=>{
    const { headers, req } = options;
    return await authOperation({
        canSetHeaders: Boolean(options.canSetHeaders),
        headers,
        req: await createLocalReq({
            req
        }, payload)
    });
};

//# sourceMappingURL=auth.js.map