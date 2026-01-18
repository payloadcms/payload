import { killTransaction } from '../../utilities/killTransaction.js';
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit.js';
import { getAccessResults } from '../getAccessResults.js';
export const accessOperation = async (args)=>{
    const { req } = args;
    adminInitTelemetry(req);
    try {
        return getAccessResults({
            req
        });
    } catch (e) {
        await killTransaction(req);
        throw e;
    }
};

//# sourceMappingURL=access.js.map