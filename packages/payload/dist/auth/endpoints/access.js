import { status as httpStatus } from 'http-status';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { accessOperation } from '../operations/access.js';
export const accessHandler = async (req)=>{
    const headers = headersWithCors({
        headers: new Headers(),
        req
    });
    try {
        const results = await accessOperation({
            req
        });
        return Response.json(results, {
            headers,
            status: httpStatus.OK
        });
    } catch (e) {
        return Response.json({
            error: e
        }, {
            headers,
            status: httpStatus.INTERNAL_SERVER_ERROR
        });
    }
};

//# sourceMappingURL=access.js.map