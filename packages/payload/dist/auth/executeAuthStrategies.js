import { logError } from '../utilities/logError.js';
import { mergeHeaders } from '../utilities/mergeHeaders.js';
export const executeAuthStrategies = async (args)=>{
    let result = {
        user: null
    };
    if (!args.payload.authStrategies?.length) {
        return result;
    }
    for (const strategy of args.payload.authStrategies){
        // add the configured AuthStrategy `name` to the strategy function args
        args.strategyName = strategy.name;
        args.isGraphQL = Boolean(args.isGraphQL);
        args.canSetHeaders = Boolean(args.canSetHeaders);
        try {
            const authResult = await strategy.authenticate(args);
            if (authResult.responseHeaders) {
                authResult.responseHeaders = mergeHeaders(result.responseHeaders || new Headers(), authResult.responseHeaders || new Headers());
            }
            result = authResult;
        } catch (err) {
            logError({
                err,
                payload: args.payload
            });
        }
        if (result.user) {
            return result;
        }
    }
    return result;
};

//# sourceMappingURL=executeAuthStrategies.js.map