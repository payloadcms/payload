import { status as httpStatus } from 'http-status';
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { findVersionByIDOperation } from '../operations/findVersionByID.js';
export const findVersionByIDHandler = async (req)=>{
    const { depth, populate, select, trash } = parseParams(req.query);
    const { id, collection } = getRequestCollectionWithID(req);
    const result = await findVersionByIDOperation({
        id,
        collection,
        depth,
        populate,
        req,
        select,
        trash
    });
    return Response.json(result, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=findVersionByID.js.map