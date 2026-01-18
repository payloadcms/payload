import { killTransaction } from '../../utilities/killTransaction.js';
import { executeAuthStrategies } from '../executeAuthStrategies.js';
import { getAccessResults } from '../getAccessResults.js';
export const auth = async (args)=>{
    const { canSetHeaders, headers } = args;
    const req = args.req;
    const { payload } = req;
    try {
        const { responseHeaders, user } = await executeAuthStrategies({
            canSetHeaders,
            headers,
            payload
        });
        req.user = user;
        req.responseHeaders = responseHeaders;
        const permissions = await getAccessResults({
            req
        });
        return {
            permissions,
            responseHeaders,
            user
        };
    } catch (error) {
        await killTransaction(req);
        throw error;
    }
};

//# sourceMappingURL=auth.js.map