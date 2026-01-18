import { status as httpStatus } from 'http-status';
import { getRequestGlobal } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { isNumber } from '../../utilities/isNumber.js';
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js';
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js';
import { sanitizeSortParams } from '../../utilities/sanitizeSortParams.js';
import { findVersionsOperation } from '../operations/findVersions.js';
export const findVersionsHandler = async (req)=>{
    const globalConfig = getRequestGlobal(req);
    const { depth, limit, page, pagination, populate, select, sort, where } = req.query;
    const result = await findVersionsOperation({
        depth: isNumber(depth) ? Number(depth) : undefined,
        globalConfig,
        limit: isNumber(limit) ? Number(limit) : undefined,
        page: isNumber(page) ? Number(page) : undefined,
        pagination: pagination === 'false' ? false : undefined,
        populate: sanitizePopulateParam(populate),
        req,
        select: sanitizeSelectParam(select),
        sort: sanitizeSortParams(sort),
        where
    });
    return Response.json(result, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=findVersions.js.map