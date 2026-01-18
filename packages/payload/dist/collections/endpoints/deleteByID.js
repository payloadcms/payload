import { status as httpStatus } from 'http-status';
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { deleteByIDOperation } from '../operations/deleteByID.js';
export const deleteByIDHandler = async (req)=>{
    const { id, collection } = getRequestCollectionWithID(req);
    const { depth, overrideLock, populate, select, trash } = parseParams(req.query);
    const doc = await deleteByIDOperation({
        id,
        collection,
        depth,
        overrideLock: overrideLock ?? false,
        populate,
        req,
        select,
        trash
    });
    const headers = headersWithCors({
        headers: new Headers(),
        req
    });
    if (!doc) {
        return Response.json({
            message: req.t('general:notFound')
        }, {
            headers,
            status: httpStatus.NOT_FOUND
        });
    }
    return Response.json({
        doc,
        message: req.t('general:deletedSuccessfully')
    }, {
        headers,
        status: httpStatus.OK
    });
};

//# sourceMappingURL=deleteByID.js.map