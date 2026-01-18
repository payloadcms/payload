import { status as httpStatus } from 'http-status';
import { getRequestCollection } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { findVersionsOperation } from '../operations/findVersions.js';
export const findVersionsHandler = async (req)=>{
    const collection = getRequestCollection(req);
    const { depth, limit, page, pagination, populate, select, sort, trash, where } = parseParams(req.query);
    const result = await findVersionsOperation({
        collection,
        depth,
        limit,
        page,
        pagination,
        populate,
        req,
        select,
        sort,
        trash,
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